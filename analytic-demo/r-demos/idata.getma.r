#' Get my account details
#'
#'@description
#' Return registered user account details including name, company, address, email and  API key.
#'@details
#'For more information please visit :  \url{https://www.idatamedia.org/api-docs#getmyaccountdetails}
#' @return json or list
#' @param SessionToken Optional. Session token from the idata.get_session_token command.
#' If no token is provided then the current token will be used. You can see the current token by typing  \code{idata.print_session_token()}.
#' @examples
#' idata.get_my_account_details()
#' @export

idata.get_my_account_details <- function(SessionToken = NULL){
  api$get_my_account_details(SessionToken = SessionToken)
}
