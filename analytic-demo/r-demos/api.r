#' Api class
#'
#' The R6 class \code{Api} allows to create new api instances and make calls using the api/idatamedia.org service.
#'
#' @importFrom R6 R6Class
#' @importFrom httr GET

#' If no token is provided then the current token (you can see it typing
#' \code{idata.print_session_token()}) will be used.

#' @param ReturnCategoryList logical. Returns detailed category information  if the datasource is a category datasource.
#'
#' @field APIKey character. Personal API key that is required to access the API
#' @field SessionToken character. A session token that can be used to access the Monitor+ API
#' @field verbose logical. If TRUE url for each call is displayed in console Default: FALSE
#' @field server character. a server name by default: "https://api.idatamedia.org/"
#' @field raw character. a output file
#'
Api <- R6::R6Class(classname = 'Api',
                   private = list(
                     m = function(txt){
                       if(self$verbose) message(txt)
                     },
                   checkToken = function(SessionToken = NULL){
                       B <- FALSE

                       if(is.null(SessionToken)) SessionToken <- self$SessionToken
                    #   if(is.null(SessionToken)){
                         #    self$get_ssession_token()
                     #    SessionToken <- self$SessionToken
                      #   B <- TRUE
                       #}


                       if(is.null(SessionToken)) {
                          message('You must provide a valid session SessionToken')
                         return(NULL)
                        } else{
                          response <- self$query_session_token(SessionToken)
                          if(is.na(response)){    #first try to renew it
                             self$renew_session_token()
                             SessionToken <- self$SessionToken
                            response <- self$query_session_token(SessionToken)
                            }
                            if(is.na(response)){    #if not work, then try to get a new token
                              self$get_session_token()
                              SessionToken <- self$SessionToken
                              B <- TRUE
                            } else B <- TRUE

                         if(!is.null(SessionToken)) {
                             return(list(B = B, SessionToken = SessionToken))
                           }else  { return(NULL)
                             }
                     }
                     },

                     zzzcheckToken = function(SessionToken = NULL){
                       B <- FALSE
                       if(is.null(SessionToken)) SessionToken <- self$SessionToken
                       if(is.null(SessionToken)){
                         self$get_ssession_token()
                         SessionToken <- self$SessionToken
                         B <- TRUE
                       } else{
                         response <- self$query_session_token(SessionToken)
                         if(is.na(response)){#first try to renew it
                           self$renew_session_token()
                           SessionToken <- self$SessionToken
                           response <- self$query_session_token(SessionToken)
                         }
                         if(is.na(response)){#if not work, then try to get a new token
                           self$get_session_token()
                           SessionToken <- self$SessionToken
                           B <- TRUE
                         } else B <- TRUE
                       }
                       return(list(B = B, SessionToken = SessionToken))
                     },


                     #counts how many mandatory params are null
                     checkMandatory = function(...){
                       l <- list(...)
                       count <- 0;i <-1
                       for(j in l){
                         if(is.null(j)){
                           message(sprintf("The Parameter '%s' is mandatory.",names(l)[i]))
                           count <- count + 1
                         }
                         i <- i + 1
                       }
                       return(count)
                     }
                   ),
                   public = list(
                     APIKey = NULL,
                     SessionToken = NULL,
                     verbose = FALSE,
                     raw = FALSE,
                     server = NULL,

                     #Auth methods
                     #-----------------
                     #' @param APIKey character Key of session
                     set_api_key = function(APIKey = NULL){
                       if(is.null(APIKey) | !is.character(APIKey)){
                         message('You must provide a valid API key.')
                       } else {
                         self$APIKey <- APIKey
                         message(sprintf("Stored the new API key %s.",APIKey))
                       }
                       if(file_test("-f", system.file("extdata", "servername.txt", package = "idmmonitor")) == TRUE)
                         self$server <- read.table(system.file("extdata", "servername.txt", package = "idmmonitor", mustWork = TRUE))[1,1]
                       else {
                         message('Please check the file "servername.txt" exists.')
                       }
                     },

                                          set_session_token = function(SessionToken = NULL){
                                            if(is.null(SessionToken) | !is.character(SessionToken)){
                                              message('You must provide a valid session SessionToken')
                                            } else {
                                              response <- self$query_session_token(SessionToken = SessionToken)
                                              if(!is.na(response)){
                                                self$SessionToken <- SessionToken
                                              #--  message("A new token has been set.")
                                                message(sprintf("A new token %s has been set.",SessionToken))
                                              }
                                            }
                                          },
                     get_api_address = function() {
                       if(is.null(self$server)){
                         message('You must set up your API key before making any calls.')
                       } else {
                         message(paste0("The API server is set to ", self$server))
                       }

                     },

                     #                     set_api_address = function(server) {
                     #                     	write.table(server, system.file("extdata", "servername.txt", package = "idmmonitor", mustWork = TRUE),
                     #                     		row.names = FALSE, col.names = FALSE)
                     #                     	self$server <- server
                     #                     	message(paste0("The API server is set to ", self$server))
                     #                     },

                     #global
                     #' Allows to set the verbose global parameter
                     #' @param verbose the variable to handle
                     #' If TRUE url for each call is displayed in console Default: FALSE
                     set_verbose = function(verbose = FALSE){
                       if(is.logical(verbose)){
                         self$verbose <- verbose
                         message(sprintf('Verbose set to %s.',verbose))
                       } else message("The Verbose parameter must be either TRUE or FALSE.")
                     },

                     #' Allows to change the format of the returned data
                     #'
                     #' Returned data could be raw JSON or R list
                     #' @param raw logical. If FALSE (default), a list generated using jsonlite package is returned. Else
                     #' a JSON string is returned.
                     set_return_raw_data = function(raw = FALSE){
                       if(is.logical(raw)){
                         self$raw <- raw
                         message(sprintf('Function parameter set to %s.',raw))
                       } else message("The Function parameter must be either TRUE or FALSE.")
                     },

                     get_api_version = function(){
                       private$m("Getting the API version number ...")
                       if(is.null(self$APIKey)){
                         message("You must set an API key before making any calls.")
                       } else{
                         response <- self$api_call(sprintf("GetAPIVersion"))
                         #response <- jsonlite::fromJSON(response)
                     #    message(paste0("The api version is ", response$Result$Version, sep = " ", collapse = " "))
                         message(sprintf("The api version is  %s.",response$Result$Version))
                         # if(self$raw)
                         # if(!is.null(response$Result$SessionToken))
                         #   # private$m(paste0("SessionToken : ",response$Result$SessionToken))
                         #   self$set_session_token(SessionToken = response$Result$SessionToken)
                       }
                     },

                     get_session_token = function(){
                       private$m("Getting a new session token ...")
                       if(is.null(self$APIKey)){
                         message("You must set an API key before making any calls.")
                       } else{
                         self$APIKey
                         response <- self$api_call(sprintf("GetSessionToken?APIKey=%s",self$APIKey))
                         if(self$raw){response <- jsonlite::fromJSON(response)}
                         if(!is.null(response$Result$SessionToken)){ #} & !is.na(response$Result$SessionToken)){
                           # private$m(paste0("SessionToken : ",response$Result$SessionToken))
                           self$set_session_token(SessionToken = response$Result$SessionToken)
                           #message(response$Result$SessionToken)
                         }
                       }
                     },
                     #' @param SessionToken character Token from server
                     renew_session_token = function(SessionToken = NULL){
                       if(is.null(SessionToken)) SessionToken <- self$SessionToken
                       if(is.null(SessionToken))
                         message("A valid token must be provided.") else{
                           private$m(sprintf("Trying to auto renew session token %s...",SessionToken))
                           response <- self$api_call(sprintf("RenewSessionToken?SessionToken=%s",SessionToken))
                           if(!is.null(response)) message("The Token has been renewed.")
                         }
                     },
                     #' @param SessionToken character  Token from server
                     revoke_session_token = function(SessionToken = NULL){
                       if(is.null(SessionToken)) SessionToken <- self$SessionToken
                       if(is.null(SessionToken))
                         message("A valid session token must be provided.") else{
                           private$m(sprintf("Revoking session token %s...",SessionToken))
                           response <- self$api_call(sprintf("RevokeSessionToken?SessionToken=%s",SessionToken))
                           if(!is.null(response)){
                             if(self$raw) response <- jsonlite::fromJSON(response)
                             message(response$Result$Details)
                           }
                         }
                     },
                     #' @param SessionToken character  Token from server
                     query_session_token = function(SessionToken = NULL){
                       if(is.null(SessionToken)){
                         SessionToken <- self$SessionToken
                         if(is.null(SessionToken)){
                           self$get_session_token()
                           SessionToken <- self$SessionToken
                         }
                       }

                       if(!is.null(SessionToken)){
                         private$m(sprintf("Querying the session token %s...",SessionToken))

                         response <- self$api_call(sprintf("SessionTokenExpires?SessionToken=%s",SessionToken))
                         if(is.null(response))
                           return(NA) else{
                             if(self$raw) response <- jsonlite::fromJSON(response)
                             if(!is.null(response$Result$Remaining)){
                               return(response$Result$Remaining)
                             }else{
                               return(NA)
                             }
                           }
                       } else return(NA)
                     },
                     #-----------------

                     #Data sources methods
                     #' @param SessionToken character  Token from server
                     #' @param Datasource  Character  The datasource on server
                     #' @param ReturnCategoryList logical
                     #' @param ReturnCategoryTree logical
                     #' @param ReturnAccess logical   return user access record
                     #' @param DateFormat character   date format for request/response
                     #-----------------
                     get_datasource = function(SessionToken = NULL,Datasource = "",ReturnCategoryList = TRUE,ReturnCategoryTree=TRUE,ReturnAccess=FALSE,DateFormat='YYYY-MM-DD'){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NULL)
                       }


                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken)){
                           return(NA)
                         }else{

                           if(Datasource =="")
                             message("The Datasource cannot be empty.") else{

                               private$m("Getting metadataor one datasource ...")
                               r <- if(ReturnCategoryList) "true" else "false"
                               r2 <- if(ReturnCategoryTree) "true" else "false"
                               r3 <- if(ReturnAccess) "true" else "false"
                               response <- self$api_call(
                                 sprintf("GetDatasource?SessionToken=%s&Datasource=%s&ReturnCategoryList=%s&ReturnCategoryTree=%s&ReturnAccess=%s&DateFormat=%s",SessionToken,Datasource,r,r2,r3,DateFormat)
                               )
                               return(response)
                             }
                         }
                       } else return(NA)
                     },
                     #' @param SessionToken character  Token from server
                     #' @param Datasource  Character  The datasource on server
                     #' @param ReturnCategoryList logical
                     #' @param ReturnCategoryTree logical
                     #' @param ReturnAccess logical   return user access record
                     #' @param DateFormat character   date format for request/response
                      get_all_datasources = function(SessionToken = NULL,ReturnCategoryList = TRUE, ReturnCategoryTree=TRUE, ReturnAccess=FALSE, DateFormat='YYYY-MM-DD'){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken

                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = self$SessionToken)) # here you don't specify argument from field
                           return(NA) else{
                             private$m("Getting all data sources...")
                             r <- if(ReturnCategoryList) "true" else "false"
                             r2 <- if(ReturnCategoryTree) "true" else "false"
                             r3 <- if(ReturnAccess) "true" else "false"
                             response <- self$api_call(
                               sprintf("GetAllDatasources?SessionToken=%s&ReturnCategoryList=%s&ReturnCategoryTree=%s&ReturnAccess=%s&DateFormat=%s",SessionToken,r,r2,r3,DateFormat)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },
                     #' @param SessionToken character  Token from server
                     #' @param Datasource  Character  The datasource on server
                     #' @param ReturnCategoryList logical
                     #' @param ReturnCategoryTree logical
                     #' @param ReturnAccess logical   return user access record
                     #' @param ReturnUserCategoryList logical
                     #' @param DateFormat character   date format for request/response
                     get_user_datasources = function(SessionToken = NULL,ReturnCategoryList = TRUE,ReturnCategoryTree=TRUE,ReturnUserCategoryList=FALSE,ReturnAccess=FALSE,DateFormat='YYYY-MM-DD'){
                #       if(is.null(SessionToken)){
                #         SessionToken <- self$SessionToken
                #         if(is.null(SessionToken)){
                #           self$get_session_token()
                #           SessionToken <- self$SessionToken
                #         }
                 #      }

                       if(is.null(self$APIKey)){
                         message("You must set an API key before making any calls.")
                         return(NA)
                       }

                       private$m("Getting user datasources..1")
                       if(is.null(SessionToken)){
                         private$m("Getting user datasources..2")
                         if (!is.null(self$SessionToken)) SessionToken <- self$SessionToken
                         if(is.null(SessionToken)){
                           self$get_session_token()
                           SessionToken <- self$SessionToken
                         }
                       }


                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }
                       if(ct$B){
                         if(private$checkMandatory(SessionToken = SessionToken) > 0)
                           return(NA) else{
                             private$m("Getting user datasources...")
                             r <- if(ReturnCategoryList) "true" else "false"
                             r2 <- if(ReturnCategoryTree) "true" else "false"
                             r3 <- if(ReturnUserCategoryList) "true" else "false"
                             r4 <- if(ReturnAccess) "true" else "false"
                             response <- self$api_call(
                               sprintf("GetUserDatasources?SessionToken=%s&ReturnCategoryList=%s&ReturnCategoryTree=%s&ReturnUserCategoryList=%s&ReturnAccess=%s&DateFormat=%s",SessionToken,r,r2,r3,r4,DateFormat)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },
                     #-----------------

                     #Datasets methods
                     #-----------------
                     #' @param datasource character. The datasource ID code.
                     #' @param dataCategory If  the datasource is a category datasource  (result parameter CategoryDS is true),
                     #'   you may filter by the Datacategory name in addition to the \code{Filter} property.
                     #' @param filter A condition used to filter the returned metadata.  See the Filters in
                     #' section 4.1 https://www.idatamedia.org/api-docs#getonedatasource
                     #' @param caseSensitive logical Is filtering case-sensitive?
                     #' @param sortOrder character Result sort order based on SortColumns property. Values can be \code{asc} or \code{desc}  for ascending or descending.
                     #' @param sortColumns character Column names used to sort the results.  Valid column names are:  Symbol, Datacategory  or
                     #' Description.  Use a comma to separate the column names e.g: \code{Datacategory, Symbol, Description}.  Datacategory
                     #' is ignored  for non CategoryDS datasources. Default \code{Symbol}.
                     #' @param ignoreEmpty logical Do not include in the result any series that contain no prices or values. Default FALSE.
                     #' @param shortRecord logical Include long description and conversion data fields in the result. Default \code{FALSE}.
                     #' @param page Number The requested page from result (see rows below). Default is 1.
                     #' @param rows Number of results per page. Default is 100. Maximum is  5000
                     #' @param valuesSince character  Only return datasets that have values after this date. You can enter the date in \code{YYYY-MM-DD}
                     #' @param SessionToken character  Token from server
                     #' @param ReturnAccess logical   return user access record
                     #' @param CategoryFilter character
                     #' @param DateFormat character   date format for request/response
                     #' format or use the word \code{Earliest}.
                     get_datasets = function(SessionToken = NULL,
                                             datasource = NULL,
                                             filter = NULL,
                                             caseSensitive = FALSE,
                                             sortOrder = 'asc',
                                             sortColumns = 'Symbol',
                                             ignoreEmpty = FALSE,
                                             shortRecord = FALSE,
                                             page = 1,
                                             rows = 100,
                                             CategoryFilter = NULL,
                                             valuesSince = 'Earliest',
                                             DateFormat='YYYY-MM-DD',
                                             ReturnAccess=FALSE){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken, datasource = datasource) > 0)
                           return(NA) else{

                             caseSensitive <- if(caseSensitive) "true" else "false"
                             ignoreEmpty <- if(ignoreEmpty) "true" else "false"
                             shortRecord <- if(shortRecord) "true" else "false"
                             ReturnAccess <- if(ReturnAccess) "true" else "false"
                             private$m("Getting datasource metadata...")
                             response <- self$api_call(
                               sprintf("GetDatasets?SessionToken=%s&Datasource=%s%s&CaseSensitive=%s&SortOrder=%s&SortColumns=%s&IgnoreEmpty=%s&ShortRecord=%s%s&Page=%s&Rows=%s&ValuesSince=%s&DateFormat=%s&ReturnAccess=%s",
                                       SessionToken,
                                       datasource,
                                       if(is.null(filter)) "" else sprintf("&Filter=%s",filter),
                                       caseSensitive,
                                       sortOrder,
                                       sortColumns,
                                       ignoreEmpty,
                                       shortRecord,
                                       if(is.null(CategoryFilter)) "" else sprintf("&CategoryFilter=%s",dataCategory),
                                       page,
                                       rows,
                                       valuesSince,
                                       DateFormat,
                                       ReturnAccess)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },
                     #' @param ShortRecord logical Include long description and conversion data fields in the result. Default \code{FALSE}.
                     #' @param ValuesSince character  Only return datasets that have values after this date. You can enter the date in \code{YYYY-MM-DD}
                     #' @param SessionToken character  Token from server
                     #' @param ReturnAccess logical   return user access record
                     #' @param DateFormat character   date format for request/response
                     #' @param Series character  list of.1s datasource/category/symbols in request
                     get_selected_datasets = function(SessionToken = NULL,
                                                      Series = NULL,
                                                      ShortRecord=FALSE,
                                                      ValuesSince="Earliest",
                                                      ReturnAccess= "FALSE",
                                                      DateFormat='YYYY-MM-DD'){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken, Series = Series) > 0)
                           return(NA) else{
                             # browser()
                             #shortRecord <- if(shortRecord) "true" else "false"
                             Series <- unlist(strsplit(Series,split = ","))
                             Series <- sapply(Series, FUN = function(s) sprintf("Series[]=%s",s))
                             Series <- Reduce(f = function(x,y) paste(x,y,sep = "&"),Series)

                             ShortRecord <- if(ShortRecord) "true" else "false"
                             ReturnAccess <- if(ReturnAccess) "true" else "false"

                             private$m("Getting datasets metadata...")
                             response <- self$api_call(
                               sprintf("GetSelectedDatasets?SessionToken=%s&%s&ShortRecord=%s&ValuesSince=%s&ReturnAccess=%s&DateFormat=%s",
                                       SessionToken,
                                       Series,
                                       ShortRecord,
                                       ValuesSince,
                                       ReturnAccess,
                                       DateFormat)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },
                     #-----------------

                     #Favorites methods
                     #' @param SessionToken character  Token from server
                     #' @param DateFormat character   date format for request/response
                     #-----------------
                     get_user_favorite_status = function(SessionToken = NULL, DateFormat='YYYY-MM-DD'){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken) > 0)
                           return(NA) else{

                             private$m("Getting user favorite status...")
                             response <- self$api_call(
                               sprintf("GetUserFavoritesStatus?SessionToken=%s",
                                       SessionToken)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },
                     #Datasets methods
                     #-----------------
                     #' @param IgnoreEmpty logical Do not include in the result any series that contain no prices or values. Default FALSE.
                     #' @param Page Number The requested page from result (see rows below). Default is 1.
                     #' @param Rows Number of results per page. Default is 100. Maximum is  5000
                     #' @param SessionToken character  Token from server
                     #' @param ReturnAccess logical   return user access record
                     #' @param DateFormat character   date format for request/response
                     #' @param ReturnFavoritesTree logical  test description.
                     #'
                     get_user_favorites = function(SessionToken = NULL,
                                                   IgnoreEmpty=FALSE,
                                                   ReturnFavoritesTree=FALSE,
                                                   ReturnAccess=FALSE,
                                                   Page=1,
                                                   Rows=500,
                                                   DateFormat='YYYY-MM-DD'){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                        if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken) > 0)
                           return(NA) else{
                             IgnoreEmpty <- if(IgnoreEmpty) "true" else "false"
                             ReturnFavoritesTree <- if(ReturnFavoritesTree) "true" else "false"
                             ReturnAccess <- if(ReturnAccess) "true" else "false"
                             private$m("Getting user favorites metadata...")
                             response <- self$api_call(
                               sprintf("GetUserFavorites?SessionToken=%s&IgnoreEmpty=%s&ReturnFavoritesTree=%s&ReturnAccess=%s&Page=%s&Rows=%s&DateFormat=%s",
                                       SessionToken,
                                       IgnoreEmpty,
                                       ReturnFavoritesTree,
                                       ReturnAccess,
                                       Page,
                                       Rows,
                                       DateFormat)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },

                     #' @param series character Collection of data source, category and symbol codes  with optional parameters.
                     #' @param SessionToken character  Token from server
                     #' Example: \code{ECBFX/EURGBP,ECBFX/EURUSD}. Note that
                     #' elements in the list are separated by \code{,}.
                     add_user_favorites = function(SessionToken = NULL,series = NULL){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken, series = series) > 0)
                           return(NA) else{

                             series <- unlist(strsplit(series,split = ","))
                             series <- sapply(series, FUN = function(s) sprintf("Series[]=%s",s))
                             series <- Reduce(f = function(x,y) paste(x,y,sep = "&"),series)

                             private$m("Adding user favorites datasets...")
                             response <- self$api_call(
                               sprintf("AddUserFavorites?SessionToken=%s&%s",
                                       SessionToken,
                                       series)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },

                     #' @param series character Collection of data source, category and symbol codes  with optional parameters.
                     #' @param SessionToken character  Token from server
                     #' Example: \code{ECBFX/EURGBP,ECBFX/EURUSD}. Note that
                     #' elements in the list are separated by \code{,}.
                     remove_user_favorites = function(SessionToken = NULL,series = NULL){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken, series = series) > 0)
                           return(NA) else{

                             series <- unlist(strsplit(series,split = ","))
                             series <- sapply(series, FUN = function(s) sprintf("Series[]=%s",s))
                             series <- Reduce(f = function(x,y) paste(x,y,sep = "&"),series)

                             private$m("Removing user favorite datasets...")
                             response <- self$api_call(
                               sprintf("RemoveUserFavoriteDatasets?SessionToken=%s&%s",
                                       SessionToken,
                                       series)
                             )
                             return(response)
                           }
                       } else return(NA)
                     },

                     #-----------------

                     #Market data methods
                     #-----------------
                     #' Get dataset values
                     #'
                     #' @param SessionToken character Session token from the GetSessionToken endpoint
                     #' @param series character Collection of data source, category and symbol codes  with optional parameters.
                     #' Example: \code{ECBFX/EURGBP,ECBFX/EURUSD}. Note that
                     #' elements in the list are separated by \code{,}.
                     #' @param startdate character The earliest date to return. ‘Earliest’ means use first available. Default format is: “YYYY-MM-DD”.
                     #' @param enddate  character The latest Date to return. ‘Latest’ means  use last available.  Default format is: “YYYY-MM-DD”.
                     #' @param periods number number of the periods instead of end date
                     #' @param commonstart logical Clip result so all series have the same start date.
                     #' @param commonend logical Clip result so all  series have the same end date.
                     #' @param commonua logical Do the CommonStart and ComonEnd parameters above use the user permissioned access dates
                     #' @param dateformat character The date format to use in the result.
                     #' @param dateorder character The date format to use in the result.
                     #' @param frequency Calculate a day to year average.  See the Frequency table in API documentation website.
                     #' @param frequencyoptions character    JSON OBJECT
                     #' @param prefill logical Fill missing values with the most recent prior value. Calculated before HandleWeekends and frequency.
                     #' @param prefilloptions character
                     #' @param fill Fill missing values with the most recent prior value. Calculated after frequency.
                     #' @param filloptions Fill missing values with the most recent prior value. Calculated after frequency.
                     #' @param postfill logical   calculated after averages
                     #' @param postfilloptions character JSON OBJECT
                     #' @param sparse logical to remove some or all rows containing only null values. See the Sparse table in API documentation website.
                     #' @param sparseoptions character  JSON Object
                     #' @param rounding If and how to round decimals in the result. See the Rounding  table in API documentation website.
                     #' @param navalue character  the character string to use in place of "NA"
                     #' @param returnmetadata logical  Return the dataset metadata
                     #' @param returnaccess logical  Return   user access properties
                     #' @param returnparameters logical  Return request parameters
                     #' @param returnbatestatus logical  Return if warnings on bates ( range/access)

                     get_dataset_values = function(SessionToken = NULL,
                                                   series = NULL,
                                                   startdate = 'Earliest',
                                                   enddate = 'Latest',
                                                   periods = 0,
                                                   commonstart = FALSE,
                                                   commonend = FALSE,
                                                   commonua= TRUE,
                                                   dateformat = 'YYYY-MM-DD',
                                                   dateorder = "asc",
                                                   frequency = 'd',
                                                   frequencyoptions=NULL,
                                                   prefill = FALSE,
                                                   prefilloptions=NULL,
                                                   fill =FALSE,
                                                   filloptions =NULL,
                                                   postfill=FALSE,
                                                   postfilloptions=NULL,
                                                   sparse = FALSE,
                                                   sparseoptions =NULL,
                                                   rounding = 'auto',
                                                   navalue = NULL,
                                                   returnmetadata=FALSE,
                                                   returnaccess=FALSE,
                                                   returnparameters=TRUE,
                                                   returnbatestatus = FALSE

                     ){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken, series = series) > 0)
                           return(NA) else{

                             series <- unlist(strsplit(series,split = ","))
                             series <- sapply(series, FUN = function(s) sprintf("Series[]=%s",s))
                             series <- Reduce(f = function(x,y) paste(x,y,sep = "&"),series)

                             commonstart <- if(commonstart) "true" else "false"
                             commonend <- if(commonend) "true" else "false"
                             commonua <- if(commonua) "true" else "false"
                             prefill <- if(prefill) "true" else "false"
                             postfill <- if(postfill) "true" else "false"
                             fill <- if(fill) "true" else "false"
                             sparse <- if(sparse) "true" else "false"

                             returnmetadata=if(returnmetadata) "true" else "false"
                             returnaccess=if(returnaccess) "true" else "false"
                             returnparameters=if(returnparameters) "true" else "false"
                             returnbatestatus=if(returnbatestatus) "true" else "false"

                             # url <- sprintf("GetDatasetValues?SessionToken=%s&%s&StartDate=%s&EndDate=%s&Periods=%s&CommonStart=%s&CommonEnd=%s&CommonUA=%s&DateFormat=%s&DateOrder=%s&Frequency=%s%s",
                             url <- sprintf("GetDatasetValues?SessionToken=%s&%s&StartDate=%s&EndDate=%s&Periods=%s&DateFormat=%s&DateOrder=%s&Frequency=%s%s",
                                            SessionToken,
                                            series,
                                            startdate,
                                            enddate,
                                            periods,
                                            # commonstart,
                                            # commonend,
                                            # commonua,
                                            dateformat,
                                            dateorder,
                                            frequency,
                                            if(is.null(frequencyoptions)) "" else sprintf("&FrequencyOptions=%s",frequencyoptions))
                             url <- sprintf("%s&Prefill=%s%s&Postfill=%s%s&Fill=%s%s&Sparse=%s%s&Rounding=%s%s",
                                            url,
                                            prefill,
                                            if(is.null(prefilloptions)) "" else sprintf("&PrefillOptions=%s",prefilloptions),
                                            postfill,
                                            if(is.null(postfilloptions)) "" else sprintf("&PrefillOptions=%s",prefilloptions),
                                            fill,
                                            if(is.null(filloptions)) "" else sprintf("&FillOptions=%s",filloptions),
                                            sparse,
                                            if(is.null(sparseoptions)) "" else sprintf("&FillOptions=%s",sparseoptions),
                                            rounding,
                                            if(is.null(navalue)) "" else sprintf("&NAValue=%s",navalue))
                             url <- sprintf("%s&ReturnMetadata=%s&ReturnAccess=%s&ReturnParameters=%s&ReturnBateStatus=%s",
                                            url,
                                            returnmetadata,
                                            returnaccess,
                                            returnparameters,
                                            returnbatestatus
                             )
                             private$m("Getting dataset values...")
                             response <- self$api_call(url)
                             return(response)
                           }
                       } else return(NA)
                     },

                    #' @param SessionToken character Session token from the get_session_token call
                    #' @param series character Collection of data source, category and symbol codes  with optional parameters.
                    #' Example: \code{ECBFX/EURGBP,ECBFX/EURUSD}. Note that
                    #' elements in the list are separated by \code{,}.
                    #' @param startdate character The earliest date to return. ‘Earliest’ means use first available. Default format is: “YYYY-MM-DD”.
                    #' @param enddate  character The latest Date to return. ‘Latest’ means  use last available. Default format is: “YYYY-MM-DD”.
                    #' @param periods number number of the periods instead of end date
                    #' @param commonstart logical Clip result so all  series have the same start date.
                    #' @param commonend logical Clip result so all  series have the same end date.
                    #' @param dateformat character The date format to use in the result.
                    #' @param dateorder character The date format to use in the result.
                    #' @param frequency Calculate a day to year average.  See the Frequency table in API documentation website.
                    #' @param frequencyoptions character    JSON OBJECT
                    #' @param prefill logical Fill missing values with the most recent prior value. Calculated before HandleWeekends and frequency.
                    #' @param prefilloptions character
                    #' @param fill Fill missing values with the most recent prior value. Calculated after frequency.
                    #' @param filloptions Fill missing values with the most recent prior value. Calculated afterfrequency.
                    #' @param postfill logical   calculated after averages
                    #' @param postfilloptions character JSON OBJECT
                    #' @param sparse logical to remove some or all rows containing only null values. See the Sparse table in API documentation website.
                    #' @param sparseoptions character  JSON Object
                    #' @param rounding If and how to round decimals in the result. See the Rounding  table in API documentation website.
                    #' @param navalue character  the character string to use in place of "NA"
                    #' @param returnmetadata logical  Return the dataset metadata
                    #' @param returnaccess logical  Return   user access properties
                    #' @param returnparameters logical  Return request parameters

                     get_dataset_valuesRC = function(SessionToken = NULL,
                                                     series = NULL,
                                                     startdate = 'Earliest',
                                                     enddate = 'Latest',
                                                     periods = 0,
                                                     commonstart = FALSE,
                                                     commonend = FALSE,
                                                     dateformat = 'YYYY-MM-DD',
                                                     dateorder = "asc",
                                                     frequency = 'd',
                                                     frequencyoptions=NULL,
                                                     prefill = FALSE,
                                                     prefilloptions=NULL,
                                                     fill =FALSE,
                                                     filloptions =NULL,
                                                     postfill=FALSE,
                                                     postfilloptions=NULL,
                                                     sparse = FALSE,
                                                     sparseoptions =NULL,
                                                     rounding = 'auto',
                                                     returnmetadata=FALSE,
                                                     returnaccess=FALSE,
                                                     returnparameters=TRUE
                     ){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken, series = series) > 0)
                           return(NA) else{

                             series <- unlist(strsplit(series,split = ","))
                             series <- sapply(series, FUN = function(s) sprintf("Series[]=%s",s))
                             series <- Reduce(f = function(x,y) paste(x,y,sep = "&"),series)

                             clipstart <- if(clipstart) "true" else "false"
                             clipend <- if(clipend) "true" else "false"
                             prefill <- if(prefill) "true" else "false"
                             postfill <- if(postfill) "true" else "false"
                             fill <- if(fill) "true" else "false"
                             sparse <- if(sparse) "true" else "false"

                             returnmetadata=if(returnmetadata) "true" else "false"
                             returnaccess=if(returnaccess) "true" else "false"
                             returnparameters=if(returnparameters) "true" else "false"

                             url <- sprintf("GetDatasetValuesRC?SessionToken=%s&%s&StartDate=%s&EndDate=%s&Periods=%s&ClipStart=%s&ClipEnd=%s&DateFormat=%s&DateOrder=%s&Frequency=%s%s",
                                            SessionToken,
                                            series,
                                            startdate,
                                            endDate,
                                            periods,
                                            commonstart,
                                            commonend,
                                            dateformat,
                                            dateorder,
                                            frequency,
                                            if(is.null(frequencyoptions)) "" else sprintf("&FrequencyOptions=%s",frequencyoptions))
                             url <- sprintf("%s&Prefill=%s%s&Postfill=%s%s&Fill=%s%s&Sparse=%s%s&Rounding=%s",
                                            url,
                                            prefill,
                                            if(is.null(prefilloptions)) "" else sprintf("&PrefillOptions=%s",prefilloptions),
                                            postfill,
                                            if(is.null(postfilloptions)) "" else sprintf("&PrefillOptions=%s",prefilloptions),
                                            fill,
                                            if(is.null(filloptions)) "" else sprintf("&FillOptions=%s",filloptions),
                                            sparse,
                                            if(is.null(sparseoptions)) "" else sprintf("&FillOptions=%s",sparseoptions),
                                            rounding)
                             url <- sprintf("%s&ReturnMetadata=%s&ReturnAccess=%s&ReturnParameters=%s",
                                            url,
                                            returnmetadata,
                                            returnaccess,
                                            returnparameters
                             )
                             private$m("Getting dataset values...")
                             response <- self$api_call(url)
                             return(response)
                           }
                       } else return(NA)
                     },

                     #' Get dataset values for a Date
                     #'
                     #' @param SessionToken Session token from the GetSessionToken endpoint
                     #' @param series Collection of data source, category and symbol codes  with optional parameters.
                     #' Example: \code{ECBFX/EURGBP,ECBFX/EURUSD}. Note that
                     #' elements in the list are separated by \code{,}.
                     #' @param date character The request date for the returned values.
                     #' @param ReturnLatest logical If no value available on the requested date then use and return the previous date that has a valid value.
                     #' @param ReturnCorrections logical If any corrections are available for the requested date range, they can be returned in the result.
                     #' @param DateFormat The date format to use in the result.
                     #' @param Rounding  character If and how to round decimals in the result. See the Rounding  table in API documentation website.
                     #' @param Frequency character Calculate a day to year average.  See the Frequency table in the API documentation on website.
                     #' @param FrequencyOptions  Control how frequency averages are calculated.
                     #' @param SparksCount number  The number of previous prices  to return (can be used to create a spark line charts in an application).
                     #' @param ReturnAccess logical  Return   user access properties
                     #' @param ReturnBateNames logical  Return bate names or bate numbers
                     #' @param ReturnBateStatus logical  Return if warnings on bates ( range/access)
                     #' @param ReturnMetadata logical  Return the dataset metadata
                     #' @param ReturnParameters logical  Return request parameters
                      #' @param prefill Fill missing values with the most recent prior value. Calculated before HandleWeekends and Frequency.
                     #' @param handleWeekends  Decide if and how weekends are handled in the source data. See  the HandleWeekends
                     #'  table in API documentation website.
                     #' @param frequency Calculate a day to year average.  See the Frequency table in API documentation website.
                     get_dataset_values_for_date = function(SessionToken = NULL,
                                                            series = NULL,
                                                            date = NULL,
                                                            ReturnLatest = FALSE,
                                                            ReturnCorrections = FALSE,
                                                            DateFormat = 'YYYY-MM-DD',
                                                            Rounding= "auto",
                                                            Frequency = 'd',
                                                            FrequencyOptions = NULL,
                                                            SparksCount = 0,
                                                            ReturnAccess= FALSE,
                                                            ReturnBateNames= FALSE,
                                                            ReturnBateStatus= FALSE,
                                                            ReturnMetadata= FALSE,
                                                            ReturnParameters= FALSE){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken, series = series, date = date) > 0)
                           return(NA) else{

                             series <- unlist(strsplit(series,split = ","))
                             series <- sapply(series, FUN = function(s) sprintf("Series[]=%s",s))
                             series <- Reduce(f = function(x,y) paste(x,y,sep = "&"),series)

                             ReturnLatest <- if(ReturnLatest) "true" else "false"
                             ReturnCorrections <- if(ReturnCorrections) "true" else "false"
                             ReturnAccess <- if(ReturnAccess) "true" else "false"
                             ReturnBateNames <- if(ReturnBateNames) "true" else "false"
                             ReturnBateStatus <- if(ReturnBateStatus) "true" else "false"
                             ReturnMetadata <- if(ReturnMetadata) "true" else "false"
                             ReturnParameters <- if(ReturnParameters) "true" else "false"

                             url <- sprintf("GetValuesForDate?SessionToken=%s&%s&Date=%s&ReturnLatest=%s&ReturnCorrections=%s&DateFormat=%s&Rounding=%s",
                                            SessionToken,
                                            series,
                                            date,
                                            ReturnLatest,
                                            ReturnCorrections,
                                            DateFormat,
                                            Rounding
                             )
                             url <- sprintf("%s&Frequency=%s%s&SparksCount=%s&ReturnAccess=%s&ReturnBateNames=%s&ReturnBateStatus=%s&ReturnMetadata=%s&ReturnParameters=%s",
                                            url,
                                            Frequency,
                                            if(is.null(FrequencyOptions)) "" else sprintf("&FrequencyOptions=%s",FrequencyOptions),
                                            SparksCount,
                                            ReturnAccess,
                                            ReturnBateNames,
                                            ReturnBateStatus,
                                            ReturnMetadata,
                                            ReturnParameters)

                             private$m("Getting dataset values for a date...")
                             response <- self$api_call(url)
                             return(response)
                           }
                       } else return(NA)
                     },

                     #-----------------

                     #-----------------
                     #My account methods

                     #' Get my account details
                     #'
                     #'
                     #' Return informtion about your account.
                     #'
                     #' @return json or list
                     #' @param SessionToken character Session token from the GetSessionToken endpoint
                     get_my_account_details = function(SessionToken = NULL){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                          return(NA)
                       }


                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken) > 0)
                           return(NA) else{
                             private$m("Getting my account details...")
                             response <- self$api_call(sprintf("GetMyAccountDetails?SessionToken=%s",SessionToken))
                             return(if(!is.null(response)) response else NA)
                           }
                       } else return(NA)
                     },

                     #' Request API Key
                     #'
                     #' Get your API key from the server using your email address.
                     #' @param SessionToken character Session token from the GetSessionToken endpoint

                     request_new_api_key = function(SessionToken = NULL){
                       ct <- private$checkToken(SessionToken)
                       SessionToken <- ct$SessionToken
                       if(is.null(SessionToken)) {
                         return(NA)
                       }

                       if(ct$B){

                         if(private$checkMandatory(SessionToken = SessionToken) > 0)
                           return(NA) else{
                             private$m("Requesting new API key...")
                             response <- self$api_call(sprintf("RequestNewAPIKey?SessionToken=%s",SessionToken))
                             return(if(!is.null(response)) response else NA)
                           }
                       } else return(NA)
                     },
                     #' SendPasswordReset
                     #' Request to reset your password using  using an emailed link.
                     #' @param Email character   email address to send reset message

                     send_password_reset = function(Email = NULL){
                       # browser()
                       if(private$checkMandatory(Email = Email) > 0)
                         return(NA) else{
                           private$m("Requesting new API key...")
                           response <- self$api_call(sprintf("SendPasswordReset?Email=%s",Email))
                           return(if(!is.null(response)) response else NA)
                         }
                     },

                     #general function to make calls

                     #' @param query character request to send
                     #' @param server character server address

                     api_call = function(query=NULL, server){
                       if(self$verbose)
                         message(sprintf("%s%s", self$server, query))

                       response <- tryCatch({
                         response <- httr::content(httr::GET(sprintf("%s%s", self$server, query)), "text", encoding = "ISO-8859-1")
                         temp <- jsonlite::fromJSON(response)
                         if(!is.null(temp$Errors)){
                           message(temp$Errors$Details)
                           NULL
                         } else{
                           if(self$raw) response else jsonlite::fromJSON(response)
                         }
                       }, error = function(e) {
                         message(e)
                         NULL
                       })
                       response
                     }
                   ))



api = Api$new()
#devtools::load_all()


