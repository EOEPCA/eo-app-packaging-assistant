import _ from "lodash";
import { DEFAULT_NAMESPACE, DEFAULT_NS_PREFIX } from "./store/store";
import Vue from "vue";

export const showNotification = (title, options = {}) => {
  const { group = 'info', type = 'warn', text = '', duration = 3000 } = options;
  Vue.notify({
    title: title,
    text: text,
    group: group,
    type: type,
    duration: duration,
  });
};

export const removeEmpty = (obj) => {
  const keepUnchanged = ['requirements', 'inputs', 'outputs'];
  if (typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) =>(typeof v === "number") || (typeof v === "boolean" && v) || !_.isEmpty(v))
      .map(([k, v]) => {
        if (typeof v === 'object' && !keepUnchanged.includes(k)) {
          if (Array.isArray(v)) return [k, v.map(e => removeEmpty(e))];
          if (Object.entries(v).filter(([, v]) => !_.isEmpty(v)).length > 0) return [k, removeEmpty(v)];
          return [k, v];
        } else {
          return [k, v];
        }
      }).filter(keyPair => !_.isEmpty(keyPair))
  );
};

const parseWorkflow = (wfl) => {
  if (typeof wfl.inputs === 'object') wfl.inputs = Object.entries(wfl.inputs).map(([k, v]) => ({ id: k, ...v }));
  if (typeof wfl.outputs === 'object') wfl.outputs = Object.entries(wfl.outputs).map(([k, v]) => ({ id: k, ...v }));
  if (typeof wfl.steps === 'object') {
    wfl.steps = Object.entries(wfl.steps).map(([k, v]) => ({
      id: k,
      ...v,
      'in': typeof v.in === 'object' ? Object.entries(v.in).map(([k, v]) =>
        ({ id: k, ...(typeof v === 'string' ? { source: [v] } : v) })) : v.in,
    }));
  }
  wfl.steps = wfl.steps.map(step => {
    step = parseRequirements(step);
    step = parseRequirements(step, 'hints');
    step.requirements = { ...step.hints, ...step.requirements };
    delete step['hints'];
    return step;
  });
  wfl = parseRequirements(wfl);
  wfl = parseRequirements(wfl, 'hints');
  wfl.requirements = { ...wfl.hints, ...wfl.requirements };
  delete wfl['hints'];
  return wfl;
};

const parseRequirements = (process, attribute = 'requirements') => {
  if (process[attribute] === undefined) {
    process[attribute] = {};
    return process;
  }
  if (Array.isArray(process[attribute])) {
    process[attribute] = process[attribute].reduce((acc, current) => {
      const classField = current.class;
      if (classField) {
        if (current.class === 'EnvVarRequirement' && Array.isArray(current.envDef)) {
          current.envDef = current.envDef.reduce((acc, envDef) => ({ ...acc, [envDef.envName]: envDef.envValue }), {});
        }
        delete current['class'];
        return { ...acc, [classField]: current };
      } else {
        return acc;
      }
    }, {});
  } else {
    if (Array.isArray(process[attribute]?.EnvVarRequirement?.envDef)) {
      process[attribute].EnvVarRequirement.envDef =
        process[attribute].EnvVarRequirement.envDef.reduce(
          (acc, envDef) => ({ ...acc, [envDef.envName]: envDef.envValue }), {});
    }
  }
  return process;
};

export const parseCommandLineTool = (clt) => {
  console.log("PARSING CLT");
  console.warn(clt);
  if (typeof clt.inputs === 'object') clt.inputs = Object.entries(clt.inputs).map(([k, v]) => ({ id: k, ...v }));
  if (typeof clt.outputs === 'object') clt.outputs = Object.entries(clt.outputs).map(([k, v]) => ({ id: k, ...v }));
  clt = parseRequirements(clt);
  clt = parseRequirements(clt, 'hints');
  clt.requirements = { ...clt.hints, ...clt.requirements };
  delete clt['hints'];
  clt.baseCommand = (typeof clt.baseCommand === 'string' ? [clt.baseCommand] : clt.baseCommand) || [];
  clt['arguments'] = (typeof clt['arguments'] === 'string' ? [clt['arguments']] : clt['arguments']) || [];
  console.warn(clt);
  return clt;
};

const parseMetadata = (cwlObject) => {
  let nsPrefix = DEFAULT_NS_PREFIX;
  cwlObject.$namespaces = cwlObject.$namespaces ? cwlObject.$namespaces : {};
  const defaultNs = Object.entries(cwlObject.$namespaces).filter(([, v]) => v === DEFAULT_NAMESPACE);
  if (defaultNs.length) {
    nsPrefix = defaultNs[0][0];
  } else {
    cwlObject.$namespaces[DEFAULT_NS_PREFIX] = DEFAULT_NAMESPACE;
  }
  const namespacedKeys = [
    ['contributor', []], ['author', []], ['dateCreated', (new Date()).toISOString().split('T')[0]],
    ['softwareVersion', undefined], ['keywords', undefined], ['codeRepository', undefined],
    ['releaseNotes', undefined], ['license', undefined], ['logo', undefined]
  ];
  namespacedKeys.forEach(entry => {
    const importedKey = Object.keys(cwlObject).find(q => q.endsWith(entry[0]));
    if (entry[0] !== 'author' && entry[0] !== 'contributor') {
      cwlObject[`${nsPrefix}:${entry[0]}`] = cwlObject[importedKey] ? cwlObject[importedKey] : entry[1];
    } else {
      cwlObject[`${nsPrefix}:${entry[0]}`] = !cwlObject[importedKey]?.length ? entry[1] :
        cwlObject[importedKey].map(el => ({
          [`${nsPrefix}:name`]: el[Object.keys(el).find(q => q.endsWith('name')) || ''],
          [`${nsPrefix}:email`]: el[Object.keys(el).find(q => q.endsWith('email')) || ''],
          [`${nsPrefix}:affiliation`]: el[Object.keys(el).find(q => q.endsWith('affiliation')) || '']
        }));
    }
    if (importedKey !== `${nsPrefix}:${entry[0]}`) delete cwlObject[importedKey];
  });
  return cwlObject;
};

export const parseCwlObject = (cwlObject) => {
  cwlObject.$graph = cwlObject.$graph.map(process => {
    if (process.class === 'Workflow') return parseWorkflow(process);
    if (process.class === 'CommandLineTool') return parseCommandLineTool(process);
    return process;
  });
  return parseMetadata(cwlObject);
};

export const validateCwlConsistency = (cwlObject) => {
  const issues = [];
  if (_.isEmpty(cwlObject.cwlVersion)) {
    issues.push('CWL Version field is required.');
  }
  if (!['CommandLineTool'].includes(cwlObject.class)) {
    issues.push(
      'The cwl must have its class set to "CommandLineTool", this field is required.'
    );
  }
  if (_.isEmpty(cwlObject.id)) {
    issues.push(
      'The cwl must have an ID set, this field is required.'
    );
  }

  if (!['CommandLineTool'].includes(cwlObject.class) || _.isEmpty(cwlObject.id)) return issues;

  if (cwlObject.inputs) {
    if (cwlObject.inputs.some(p => _.isEmpty(p.id))) {
      issues.push(
        `All inputs of ${cwlObject.class} with id "${cwlObject.id}" must have an ID set, this field is required.`
      );
    }
    const pInputsIds = cwlObject.inputs.map(p => p.id).filter(identifier => !_.isEmpty(identifier));
    if (pInputsIds.length !== _.uniq(pInputsIds).length) {
      issues.push(
        `All inputs ids of ${cwlObject.class} with id "${cwlObject.id}" must be unique.`
      );
    }
  }
  if (cwlObject.outputs) {
    if (cwlObject.outputs.some(p => _.isEmpty(p.id))) {
      issues.push(
        `All outputs ${cwlObject.class} with id "${cwlObject.id}" must have an ID set, this field is required.`
      );
    }
    const pOutputsIds = cwlObject.outputs.map(p => p.id).filter(identifier => !_.isEmpty(identifier));
    if (pOutputsIds.length !== _.uniq(pOutputsIds).length) {
      issues.push(
        `All outputs ids of ${cwlObject.class} with id "${cwlObject.id}" must be unique.`
      );
    }
  }

  return issues;
};

export function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

export const getURLParam = (param, default_) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(param) || default_;
};

export const showApiErrorAsNotification = error => {
  if (error.response.status >= 400) error.response.json().then(errObj =>
    showNotification('Request Error', { type: 'error', text: errObj.detail, duration: 5000, group: 'global' })
  );
};

export function arrayUnique(array) {
  let a = array.concat();
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i].identifier === a[j].identifier) a.splice(j--, 1);
    }
  }
  return a;
}