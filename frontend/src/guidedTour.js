import {waitForElm} from "./utils";
import {REMOVE_COMMAND_LINE_TOOL, SET_MODE} from "./store/action-types";

let userMode = 'simple';

export const guidedTours = {
  applicationImportToolTour: (apEditor) => {
    return [
      {
        target: '#clt-tab-title',
        content: 'Use this tab to configure your processing task.',
        before: () => {
          apEditor.currentTab = 0;
        }
      },
      { 
        target: "#clt-file-storage",
        content: "These buttons can be used to manage CWL snippets on the server or on your computer."
      },
      {
        target: `#clt-exec-command`,
        content: 'Enter here the command to run your processing application. ' + 
        '(For example, "python", or "bash")',
      },
      {
        target: `#clt-args-command`,
        content: 'Specify here the static arguments. Dynamic arguments are constructed ' +
          'using the task inputs. ' +
          'Note that if you want to pass a script file which you uploaded you should use an absolute path. ' + 
          'For example, if you upload a script "process_data.py" (using the "application files" tab) ' + 
          'that script will be available at "/app/process_data.py".',
      },
      {
        target: `#clt-input-modal-btn`,
        content: 'Click here to define a new task input.',
        before: type => type === 'previous' ?
          document.getElementById('clt-input-modal-cancel-btn')?.click() : null
      },
      {
        target: '#clt-input-form',
        content: 'Give the inputs a name, a type, and indicate at what position they should appear in the command' +
        ' (keep in mind that inputBinding positions are relative to other inputBinding values and are not absolute)',
        before: async () => {
          document.getElementById('clt-input-modal-btn')?.click();
          await waitForElm('#clt-input-form');
        }
      },
      {
        target: '#clt-outputs',
        content: 'Configure the task outputs.',
        before: () => document.getElementById('clt-input-modal-cancel-btn')?.click()
      },
      {
        target: '#clt-requirements',
        content: 'Indicate additional requirements for your application.',
        before: type => {
          type === 'previous' ? apEditor.currentTab = 0 : null;
        }
      },
      {
        target: '#af-tab-title',
        content: 'Upload files to be included in your application. These can be Python scripts, bash scripts etc.' +
        ' If a requirements.txt file is present, the listed packages will be installed as well.',
        before: async () => {
          apEditor.currentTab = 1;
          await waitForElm('#af-tab-title');
        }
      },
      {
        target: '#build-options-tab-title',
        content: 'Configure the build options for your application in this section.',
        before: async () => {
          apEditor.currentTab = 2;
          await waitForElm('#build-options-tab-title');
        }
      },
      {
        target: '#software-dependencies',
        content: 'Select which packages your application requires. ' + 
        'Packages that conflict with each other will be greyed out.'
      },
      {
        target: '#registry-type',
        content: 'Select the target registry where you would like the application image to be pushed to.'
      },
      {
        target: '#docker-image-tag',
        content: 'Configure the tag that should be used in the docker image reference.'
      },
      {
        target: '#dry-run',
        content: 'Build your image without pushing it into any registry.'
      },
      {
        target: '#build-and-push',
        content: 'Build your image and push it to the selected registry if the build is successful.'
      },
      {
        target: '#perform-dry-run',
        content: 'If you define default values for all of your application inputs,' + 
        ' you can select this option to perform a dry-run.' +
        ' This will initiate a test execution with the given values ' +
        'to verify that your application can run correctly.',
      },
      {
        target: '#live-output',
        content: 'Show live output of the application build process (and optional dry-run).'
      },
      {
        target: '#buildlog',
        content: 'Show a more detailed log of the build process, dry-run and push process. ' + 
        'This can be very helpful when trying to identify issues.'
      }
    ];
  },
};

export const guidedToursCallbacks = {
  applicationImportToolTour: (apEditor) => ({
    onStart: () => {
      userMode = apEditor.$store.state.mode;
      apEditor.$store.dispatch(SET_MODE, 'advanced');
    },
    onStop: () => {
      apEditor.$store.dispatch(SET_MODE, userMode);
      apEditor.guidedTourRunning = false;
    },
  }),
};
