export function setAuthToken(token){
    localStorage.setItem("jwt_token", token);
}
export function getAuthToken(){
    return localStorage.getItem("jwt_token");
}
export default {
    setAuthToken, getAuthToken
}