export function setCredentials(username, token){
    localStorage.setItem("username", username);
    localStorage.setItem("jwt_token", token);
}
export function getAuthToken(){
    return localStorage.getItem("jwt_token");
}
export function getUsername(){
    return localStorage.getItem("username");
}
export function clearCredentials(){
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("username");
}
export function isLoggedIn(){
    return getUsername() !== null;
}
export default {
    setCredentials, getAuthToken, getUsername, clearCredentials, isLoggedIn
}