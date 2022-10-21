/****************************
    Was Session Expires?
****************************/

let sessionTokenURL = getSession();

call_api_ajax('SessionTokenExpires', 'get', { SessionToken : sessionTokenURL }, false, null, () => {
    window.location.href = '/login';
    return false;
});