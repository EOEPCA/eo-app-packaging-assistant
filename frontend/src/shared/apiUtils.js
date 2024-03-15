export class ApiError extends Error {
    constructor(response) {
        super(response.statusText);
        this.response = response;
    }
}

const _buildOptions = (method, body) => {
    const options = {
        credentials: 'same-origin',
        method: method,
    };
    if (body) {
        if (body instanceof FormData) { // file upload
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
            options.headers = {'Content-Type': 'application/json'};
        }
    }
    return options;
};

const _handleErrors = response => {
    if (!response.ok) {
        const error = new ApiError(response);
        throw error;
    }
    return response;
};

const _buildQueryString = (url, queryParams) => {
    let queryString = '?';
    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== null) {
            queryString += `${key}=${encodeURIComponent(value)}&`;
        } else {
            // Flag-like support e.g. ?base-information does not take a value
            queryString += `${key}&`;
        }
    });
    return url + queryString;
};

const _callFetch = (url, options, queryParams) => {
    if (queryParams && typeof queryParams === 'object') {
        url = _buildQueryString(url, queryParams);
    }
    return fetch(url, options)
        .then(_handleErrors)
        .then(response => {
            // Skip parsing empty response body (e.g. 204)
            if (response.headers.get('Content-Length') > 0) {
                return response.json();
            }
        });
};

export default {
    get: (url, queryParams) => _callFetch(url, _buildOptions('GET'), queryParams),
    post: (url, body) => _callFetch(url, _buildOptions('POST', body)),
    put: (url, body) => _callFetch(url, _buildOptions('PUT', body)),
    patch: (url, body) => _callFetch(url, _buildOptions('PATCH', body)),
    delete: (url, body) => _callFetch(url, _buildOptions('DELETE', body)),
};
