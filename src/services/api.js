import axios from 'axios';

/**
 * Common generic API service for handling network requests.
 * Uses axios for requests and standardizes responses and error handling.
 */

// 1. Post Request with Multipart Form Data (For File Uploads)
export const postRequestWithFile = async (URL, requestData, callback) => {
    try {
        // if (!requestData.country_code) {
        //    requestData.country_code = "+91";
        // }
        
        const response = await axios({
            method  : "POST",
            url     : URL,
            data    : requestData,
            headers : {
                // "access_token" : sessionStorage.getItem('buyer_token') || localStorage.getItem('buyer_token'),
                "Content-Type" : "multipart/form-data"
            }
        });
        
        // Execute callback if provided, otherwise return promise data
        if (callback) {
            return callback(response.data);
        }
        return response.data;

    } catch (err) {
        const errorObj = {code : 500, message : 'Connection failed, please start node server'};
        if (callback) {
            return callback(errorObj);
        }
        // throw err;
        return errorObj;
    }
}

// 2. Standard Post Request (JSON)
export const postRequest = async (URL, requestData, callback) => {
    try {
        const response = await axios({
            method  : "POST",
            url     : URL,
            data    : requestData,
            headers : {
                // "access_token" : sessionStorage.getItem('buyer_token') || localStorage.getItem('buyer_token'),
                "Content-Type" : "application/json"
            }
        });
        
        if (callback) return callback(response.data);
        return response.data;
        
    } catch (err) {
        const errorObj = {
            code: err.response?.status || 500, 
            message: err.response?.data?.message || 'Connection failed, please start node server'
        };
        if (callback) return callback(errorObj);
        return errorObj;
    }
}

// 3. Standard Get Request
export const getRequest = async (URL, callback) => {
    try {
        const response = await axios({
            method  : "GET",
            url     : URL,
            headers : {
                // "access_token" : sessionStorage.getItem('buyer_token') || localStorage.getItem('buyer_token'),
                "Content-Type" : "application/json"
            }
        });
        
        if (callback) return callback(response.data);
        return response.data;
        
    } catch (err) {
        const errorObj = {
            code: err.response?.status || 500, 
            message: err.response?.data?.message || 'Connection failed, please start node server'
        };
        if (callback) return callback(errorObj);
        return errorObj;
    }
}
