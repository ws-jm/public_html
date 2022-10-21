import sys
from pprint import pprint

modules_required = []

try:
    import requests as r
except:
    modules_required.append('requests')
    print("Module 'requests' not found.")


try:
    import colorama
    from colorama import Fore, Style
    colorama.init(strip=False)
    use_colour_text = True
except:
    use_colour_text = False
    print("Module 'colorama' not found.")

try:
    from typing import Any, Optional
except:
    modules_required.append('typing')
    print("Module 'typing' not found.")



if modules_required:
    text = "[WARNING] Following required modules are missing : {}".format(modules_required)

    if use_colour_text:
       print(Fore.RED + text + Style.RESET_ALL)
    else:
       print(text)

    sys.exit()


def color_print(text):
    if use_colour_text:
        print(Fore.RED + "[WARNING] " + text + Style.RESET_ALL)
    else:
       print("[WARNING] " + text)


def help_manager(func):
    def wrapper(self, *args, **kwargs):
        if len(args) > 0 and args[0] == "?":
            print(func.__doc__)
            return
        return func(self, *args, **kwargs)
    return wrapper


def session_manager(func):
    RENEW_LIMIT = 1000 * 1000 # max. 1800 * 1000 milliseconds or  30 minutes

    def wrapper(self, *args, **kwargs):
        if self.session_token is None:
            self.get_session_token()

        valid_for = self.query_session_token()
        if valid_for < RENEW_LIMIT:
            self.renew_session_token()
        elif valid_for is None:
            self.get_session_token()

        retval = func(self, *args, **kwargs)
        print()
        return retval
    return wrapper


class IData:
    """
    Python interface for http://api.idatamedia.org
    """
    def __init__(self, api_key=None, session_token=None, verbose=False, raw=False, traceback=False):
        self.API_URL = "https://api.idatamedia.org/"
        self.API_KEY = api_key
        self.verbose = verbose
        self.raw = raw
        self.traceback = traceback
        self.session_token = session_token

    def __print_response(self, resp):
        if self.raw is True:
            pprint(resp)

    @help_manager
    def __m(self, text):
        if self.verbose is True:
            if use_colour_text:
                print(Fore.CYAN + "[INFO] " + text + Style.RESET_ALL)
            else:
                print("[INFO] " + text)

    @help_manager
    def __api_call(self, extension="", payload=None, req_mehtod="GET"):
        try:
            if req_mehtod == "GET":
                resp = r.get(self.API_URL + extension, params=payload)
            else:
                resp = r.post(self.API_URL + extension, params=payload)
            self.__m("API call to: {}, Request mehtod: {}".format(resp.url, req_mehtod))
            resp = resp.json()

            self.__print_response(resp)

        except Exception as e:
            color_print("Unexpected Error: {}".format(e))
            return {}
        
        errors = resp.get("Errors", None)

        if errors:
            for error in errors:
                error_status = error.get("Status", None)
                error_detail = error.get("Details", None)

                color_print("Error {}: {}".format(error_status, error_detail))

                # if Traceback is set to True, Raise exception
                if self.traceback:
                    raise Exception("Error {}: {}".format(error_status, error_detail))
                else:
                    return {}
        else:
            retval = resp.get("Result", None)

            if retval is None:
                return {}
            return retval

    @help_manager
    def set_verbose(self, verbose):
        """
        If true extra the request details are displayed in the console.
        """
        if bool(verbose):
            self.verbose = True
        else:
            self.verbose = False
        
        self.__m("Verbose settting updated to {}".format(self.verbose))

        return None

    @help_manager
    def set_return_raw_data(self, raw):
        """
        If true return raw JSON is returned from all server requests.
        """
        if bool(raw):
            self.raw = True
        else:
            self.raw = False
        
        self.__m("Raw settting updated to {}".format(raw))

        return None

    @help_manager
    def set_traceback(self, traceback: bool):
        """
        If true raises exceptions with traceback detail.
        Otherwise only prints Exception details.
        """
        if traceback:
            self.traceback = True
        else:
            self.traceback = False
        
        self.__m("Traceback settting updated to {}".format(self.traceback))

        return None

    @help_manager
    def set_api_key(self, API_KEY):
        """
        Register your API key to be able to get a session token.
        """
        if API_KEY:
            self.API_KEY = API_KEY
            self.__m("Stored the new API key {}".format(self.API_KEY))
        else:
            self.__m("You must provide a valid API key.")

        return None

    @help_manager
    def set_api_url(self, API_URL):
        """
        Set the url for the API server
        """
        if API_URL:
            self.API_URL = API_URL
            self.__m("Changed the API URL {}".format(self.API_URL))
        else:
            self.__m("You must provide a valid API address.")

        return None

    @help_manager
    def print_api_key(self):
        """
        Return the API key that was set with the set_api_key command.
        """
        return self.API_KEY

    @help_manager
    def get_api_address(self):
        """
        Returns the API address
        """
        return self.API_URL

    @help_manager
    def get_api_version(self):
        """
        Returns the API version number
        https://www.idatamedia.org/api-docs#apiversion
        """
        resp = self.__api_call("GetAPIVersion")
        return resp.get("Version")

    @help_manager
    def set_session_token(self, session_token):
        """
        Update session token of Idata class instance.
        """
        self.session_token = session_token

        self.__m("Session token updated: {}".format(session_token))

        return session_token

    @help_manager
    def get_session_token(self):
        """
        Get session token of Idata class instance.
        https://www.idatamedia.org/api-docs#sessiontoken
        """

        payload = {
            "APIKey": self.API_KEY,
        }

        self.__m("Retrieving session token using: {}".format(self.API_KEY))
        resp = self.__api_call("GetSessionToken", payload)
        if resp:
            session_token = resp.get("SessionToken", None)
            self.__m("Session token retrieved: {}".format(session_token))

            self.session_token = session_token

            return session_token

    @help_manager
    def query_session_token(self):
        """
        Return the remaining token life in milliseconds.
        https://www.idatamedia.org/api-docs#querysessiontoken
        """
        payload = {
            "SessionToken": self.session_token,
        }

        self.__m("Retrieving expiration time for {}".format(self.session_token))
        resp = self.__api_call("QuerySessionToken", payload)
        if resp:
            remaining = resp.get('Remaining', None)
            self.__m("Remaining {} ms.".format(remaining))

            return remaining

    @help_manager
    def renew_session_token(self):
        """
        Renew the current token to full life.
        https://www.idatamedia.org/api-docs#renewsessiontoken
        """
        payload = {
            "SessionToken": self.session_token,
        }

        self.__m("Renewing session token.")
        resp = self.__api_call("RenewSessionToken", payload)
        if resp:
            self.__m("Session token renewed.")
            session_token = resp.get('SessionToken', None) 
            return session_token

    @help_manager
    def revoke_session_token(self):
        """
        Invalidate the current token on the server.
        https://www.idatamedia.org/api-docs#revokesessiontoken
        """
        payload = {
            "SessionToken": self.session_token,
        }
        self.__m("Revoking following session token: {}".format(self.session_token))
        resp = self.__api_call("RevokeSessionToken", payload)
        if resp:
            resp_details = resp.get("Details", None)
            self.__m("{}.".format(resp_details))

            return resp_details

    @help_manager
    def print_session_token(self):
        """
        Returns session token from IData instance.
        """
        return self.session_token

    @session_manager
    @help_manager
    def get_datasource(self,
                       datasource: str,
                       return_category_list: Optional[bool] = True,
                       return_category_tree: Optional[bool] = True,
                       return_access: Optional[bool] = False,
                       date_format: str = "YYYY-MM-DD"
                       ) -> dict:
        """
        Return the metadata for one named datasource.
        https://www.idatamedia.org/api-docs#getonedatasource
        """
        payload = {
            "SessionToken": self.session_token,
            "Datasource": datasource,
            "ReturnCategoryList": 'true' if return_category_list else 'false',
            "ReturnCategoryTree": 'true' if return_category_tree else 'false',
            "ReturnAccess": 'true' if return_access else 'false',
            "DateFormat": date_format
        }

        self.__m("Retreiving datasource for {}".format(datasource))
        resp = self.__api_call("GetDatasource", payload)
        if resp:
            self.__m("Datasource retrieved.")

            return resp

    @session_manager
    @help_manager
    def get_all_datasources(self,
                       return_category_list: Optional[bool] = True,
                       return_category_tree: Optional[bool] = True,
                       return_user_category_list: Optional[bool] = False,
                       return_access: Optional[bool] = False,
                       date_format: str = "YYYY-MM-DD"
                       ) -> list:
        """
        Return the metadata for all available datasources.
        https://www.idatamedia.org/api-docs#getalldatasource
        """
        payload = {
            "SessionToken": self.session_token,
            "ReturnCategoryList": 'true' if return_category_list else 'false',
            "ReturnCategoryTree": 'true' if return_category_tree else 'false',
            "ReturnUserCategoryList" : 'true' if return_user_category_list else 'false',
            "ReturnAccess": 'true' if return_access else 'false',
            "DateFormat": date_format
        }

        self.__m("Retreiving all datasources...")
        resp = self.__api_call("GetAllDatasources", payload)
        if resp:
            self.__m("Total {} datasources retrieved.".format(len(resp)))

            return resp

    @session_manager
    @help_manager
    def get_user_datasources(self,
                             return_category_list: Optional[bool] = True,
                             return_category_tree: Optional[bool] = True,
                             return_user_category_list: Optional[bool] = False,
                             return_access: Optional[bool] = False,
                             date_format: str = "YYYY-MM-DD") -> list:
        """
        Return the metadata for only the datasources that the user can access.
        https://www.idatamedia.org/api-docs#userdatasource
        """
        payload = {
            "SessionToken": self.session_token,
            "ReturnCategoryList": 'true' if return_category_list else 'false',
            "ReturnCategoryTree": 'true' if return_category_tree else 'false',
            "ReturnUserCategoryList" : 'true' if return_user_category_list else 'false',
            "ReturnAccess": 'true' if return_access else 'false',
            "DateFormat": date_format
        }
        self.__m("Retrieving user datasources.")
        resp = self.__api_call("GetUserDatasources", payload)
        if resp:
            self.__m("Total {} user datasources retrieved.".format(len(resp)))
        
            return resp

    @session_manager
    @help_manager
    def get_dataset_of(self,
                       datasource: str,
                       filters: Optional[str] = None,
                       case_sensitive: Optional[bool] = None,
                       sort_order: Optional[str] = None,
                       sort_columns: Optional[str] = None,
                       ignore_empty: Optional[bool] = None,
                       short_record: Optional[bool] = None,
                       category_tree: Optional[bool] = None,
                       category_list: Optional[bool] = None,
                       user_category_list: Optional[bool] = None,
                       category_filter: Optional[str] = None,
                       page: Optional[int] = None,
                       rows: Optional[int] = None,
                       values_since: Optional[str] = None) -> dict:
        """
        Retrieve the metadata for all (or some) of the datasets in one datasource.
        https://www.idatamedia.org/api-docs#datasetsonesource
        """

        payload = {
            "SessionToken":             self.session_token,
            "Datasource":               datasource,
            "Filter":                   filters,
            "CaseSensitive":            None if case_sensitive is None else str(case_sensitive).lower(),
            "SortOrder":                sort_order,
            "SortColumns":              sort_columns,
            "IgnoreEmpty":              None if ignore_empty is None else str(ignore_empty).lower(),
            "ShortRecord":              None if short_record is None else str(short_record).lower(),
            "ReturnCategoryTree":       None if category_tree is None else str(category_tree).lower(),
            "ReturnCategoryList":       None if category_list is None else str(category_list).lower(),
            "ReturnUserCategoryList":   None if user_category_list is None else str(user_category_list).lower(),
            "CategoryFilter":           category_filter,
            "Page":                     page,
            "Rows":                     rows,
            "ValuesSince":              values_since,
        }
        self.__m("Retrieving datasets for {}.".format(datasource))
        resp = self.__api_call("GetDatasets", payload)
        if resp:
            self.__m("Datasets retrieved.")
            return resp

    @session_manager
    @help_manager
    def get_datasets(self,
                     data_source: str,
                     session_token: Optional[str] = None,
                     filter: Optional[str] = None,
                     category_filter: Optional[str] = None,
                     case_sensitive: Optional[bool] = False,
                     sort_order: Optional[str] = 'asc',
                     sort_columns: Optional[str] = 'Symbol',
                     ignore_empty: Optional[bool] = False,
                     short_record: Optional[bool] = False,
                     page: Optional[int] = 1,
                     raws: Optional[int] = 100,
                     value_since: Optional[str] = None,
                     date_format: Optional[str] = 'YYYY-MM-DD',
                     return_access: Optional[bool] = False) -> dict:
        """
        Return metadata for the datasets in one datasource
        https://www.idatamedia.org/api-docs#datasetsonesource
        """

        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "Datasource": data_source,
            "CaseSensitive": 'true' if case_sensitive else 'false',
            "SortOrder": sort_order,
            "SortColumns": sort_columns,
            "IgnoreEmpty": 'true' if ignore_empty else 'false',
            "ShortRecord": 'true' if short_record else 'false',
            "Page": page,
            "Rows": raws,
            "DateFormat": date_format,
            "ReturnAccess": 'true' if return_access else 'false',
        }
        if filter:
            payload['Filter'] = filter
        if category_filter:
            payload['CategoryFilter'] = category_filter
        if value_since:
            payload['ValuesSince'] = value_since

        self.__m("Retrieving datasets")
        resp = self.__api_call("GetDatasets", payload)
        if resp:
            self.__m("Datasets retrieved.")

            return resp

    @session_manager
    @help_manager
    def get_selected_datasets(self,
                             series: list,
                             session_token: Optional[str] = None,
                             short_record: Optional[bool] = False,
                             value_since: Optional[str] = None,
                             return_access: Optional[bool] = False,
                             date_format: Optional[str] = 'YYYY-MM-DD'
                             ) -> dict:
        """
        Return metadata for multiple named datasets in one or more datasources.
        https://www.idatamedia.org/api-docs#datasetsmultiplesources
        """

        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "Series[]": series,
            "ShortRecord": 'true' if short_record else 'false',
            "DateFormat": date_format,
            "ReturnAccess": 'true' if return_access else 'false',
        }
        if value_since:
            payload['ValuesSince'] = value_since

        self.__m("Retrieving datasets")
        resp = self.__api_call("GetSelectedDatasets", payload, "POST")
        if resp:
            self.__m("Datasets retrieved.")

            return resp

    @session_manager
    @help_manager
    def get_user_favorites_status(self):
        """
        Return the server date and time that the user favorites list was last changed.
        https://www.idatamedia.org/api-docs#favoritestatus
        """
        payload = {
            "SessionToken": self.session_token,
        }

        resp = self.__api_call("GetFavoritesStatus", payload)
        if resp:
            return resp

    @session_manager
    @help_manager
    def get_user_favorites(self,
                      session_token: Optional[str] = None,
                      ignore_empty: bool = False,
                      return_favorites_tree: Optional[bool] = False,
                      return_access: Optional[bool] = False,
                      page: Optional[int] = 1,
                      rows: Optional[int] = 50,
                      date_format: Optional[str] = "YYYY-MM-DD") -> dict:
        """
        Return metadata for all the datasets in the user favorites list.
        https://www.idatamedia.org/api-docs#favoritesmetadata
        """
        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "IgnoreEmpty": "true" if ignore_empty else "false",
            "ReturnFavoritesTree": "true" if return_favorites_tree else "false",
            "ReturnAccess": "true" if return_access else "false",
            "Page": page,
            "Rows": rows,
            "DateFormat": date_format,
        }

        self.__m("Retrieving user favorites.")
        resp = self.__api_call("GetUserFavorites", payload)
        if resp:
            self.__m("User favorites retrieved.")

            return resp

    @session_manager
    @help_manager
    def add_user_favorites(self,
                           series: list,
                           session_token: str = None):
        """
        Add datasets to the user favorites list.
        https://www.idatamedia.org/api-docs#adddatasetstofavorites
        """

        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "Series[]": series,
        }

        self.__m("Adding {} to favorites.".format(', '.join(series)))
        resp = self.__api_call("AddFavorites", payload, "POST")
        if resp:
            status_code = resp.get("Status", None)
            detail = resp.get("Detail", None)

            if status_code == 204:
                self.__m("This symbol is already in  the User Favorites. Request ignored.")
            elif status_code == 200:
                self.__m("A new symbol was successfully added.")
            else:
                self.__m("Unknown status code: {}, {}".format(status_code, detail))

            return resp

    @session_manager
    @help_manager
    def remove_user_favorites(self,
                              series: list,
                              session_token: str = None) -> dict:
        """
        Remove datasets from your user favorites list.
        https://www.idatamedia.org/api-docs#removedatasetfromfavorites
        """

        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "Series[]": series,
        }

        self.__m("Removing {} from favorites.".format(', '.join(series)))
        resp = self.__api_call("RemoveFavorites", payload, "POST")
        if resp:
            status_code = resp.get("Status", None)
            detail = resp.get("Detail", None)

            if status_code == 204:
                self.__m("This symbol is not in the User Favorites. Request ignored.")
            elif status_code == 200:
                self.__m("New symbol successfully deleted.")
            else:
                self.__m("Unknown status code: {}, {}".format(status_code, detail))

            return resp

    @session_manager
    @help_manager
    def get_dataset_values(self,
                           series: list,
                           session_token: str = None,
                           start_date: Optional[str] = "Earliest",
                           end_date: Optional[str] = "Latest",
                           periods: Optional[int] = 0,
                           common_start: Optional[bool] = False,
                           common_end: Optional[bool] = False,
                           common_ua: Optional[bool] = True,
                           date_format: Optional[str] = "YYYY-MM-DD",
                           date_order: Optional[str] = "asc",
                           prefill: Optional[bool] = False,
                           fill: Optional[bool] = False,
                           frequency: Optional[str] = 'd',
                           post_fill: Optional[bool] = False,
                           rounding: Optional[str] = 'auto',
                           return_metadata: Optional[bool] = False,
                           return_access: Optional[bool] = False,
                           return_parameters: Optional[bool] = False,
                           return_basestatus: Optional[bool] = False,
                           prefill_options: Optional[dict] = None,
                           fill_options: Optional[dict] = None,
                           frequency_options: Optional[dict] = None,
                           postfill_options: Optional[dict] = None,
                           sparse: Optional[str] = None,
                           sparse_options: Optional[dict] = None,
                           na_value: Optional[Any] = None) -> list:
        """
        Return a range of dataset values (or averages for named datasets in one or more datasources.
        https://www.idatamedia.org/api-docs#getdatasetvalues
        """

        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "Series[]": series,
            "StartDate": start_date,
            "EndDate": end_date,
            "Periods": periods,
            "CommonStart": str(common_start).lower(),
            "CommonEnd": str(common_end).lower(),
            "CommonUA": str(common_ua).lower(),
            "DateFormat": date_format,
            "DateOrder": date_order,
            "Prefill": str(prefill).lower(),
            "Fill": str(fill).lower(),
            "Frequency": frequency,
            "Postfill": str(post_fill).lower(),
            "Rounding": rounding,
            "ReturnMetadata": str(return_metadata).lower(),
            "ReturnAccess": str(return_access).lower(),
            "ReturnParameters": str(return_parameters).lower(),
            "ReturnBateStatus": str(return_basestatus).lower(),
        }

        if prefill_options:
            payload['PrefillOptions'] = prefill_options

        if fill_options:
            payload['FillOptions'] = fill_options

        if frequency_options:
            payload['FrequencyOptions'] = frequency_options

        if postfill_options:
            payload['PostFillOptions'] = postfill_options

        if sparse:
            payload['Sparse'] = sparse

        if sparse_options:
            payload['SparseOptions'] = sparse_options

        if na_value:
            payload['NAValue'] = na_value

        resp = self.__api_call("GetValues", payload, "POST")
        if resp:
            return resp


    @session_manager
    @help_manager
    def get_dataset_values_rc(self,
                           series: list,
                           session_token: str = None,
                           start_date: Optional[str] = "Earliest",
                           end_date: Optional[str] = "Latest",
                           periods: Optional[int] = 0,
                           common_start: Optional[bool] = False,
                           common_end: Optional[bool] = False,
                           common_ua: Optional[bool] = True,
                           date_format: Optional[str] = "YYYY-MM-DD",
                           date_order: Optional[str] = "asc",
                           prefill: Optional[bool] = False,
                           fill: Optional[bool] = False,
                           frequency: Optional[str] = 'd',
                           post_fill: Optional[bool] = False,
                           rounding: Optional[str] = 'auto',
                           return_metadata: Optional[bool] = False,
                           return_access: Optional[bool] = False,
                           return_parameters: Optional[bool] = False,
                           prefill_options: Optional[dict] = None,
                           fill_options: Optional[dict] = None,
                           frequency_options: Optional[dict] = None,
                           postfill_options: Optional[dict] = None,
                           sparse: Optional[str] = None,
                           sparse_options: Optional[dict] = None,
                           na_value: Optional[Any] = None) -> list:
        """
        As get_dataset_values above but returned formatted row x column.
        https://www.idatamedia.org/api-docs#getdatasetvalues
        """

        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "Series[]": series,
            "StartDate": start_date,
            "EndDate": end_date,
            "Periods": periods,
            "CommonStart": str(common_start).lower(),
            "CommonEnd": str(common_end).lower(),
            "CommonUA": str(common_ua).lower(),
            "DateFormat": date_format,
            "DateOrder": date_order,
            "Prefill": str(prefill).lower(),
            "Fill": str(fill).lower(),
            "Frequency": frequency,
            "Postfill": str(post_fill).lower(),
            "Rounding": rounding,
            "ReturnMetadata": str(return_metadata).lower(),
            "ReturnAccess": str(return_access).lower(),
            "ReturnParameters": str(return_parameters).lower(),
        }

        if prefill_options:
            payload['PrefillOptions'] = prefill_options

        if fill_options:
            payload['FillOptions'] = fill_options

        if frequency_options:
            payload['FrequencyOptions'] = frequency_options

        if postfill_options:
            payload['PostFillOptions'] = postfill_options

        if sparse:
            payload['Sparse'] = sparse

        if sparse_options:
            payload['SparseOptions'] = sparse_options

        if na_value:
            payload['NAValue'] = na_value

        resp = self.__api_call("GetValuesRC", payload, "POST")

        if resp:
            return resp

    @session_manager
    @help_manager
    def get_dataset_values_for_date(self,
                                    series: list,
                                    date: str,
                                    session_token: str = None,
                                    return_latest: Optional[bool] = False,
                                    return_corrections: Optional[bool] = True,
                                    date_format: Optional[str] = 'YYYY-MM-DD',
                                    rounding: Optional[str] = 'auto',
                                    frequency: Optional[str] = 'd',
                                    return_access: Optional[bool] = False,
                                    return_batenames: Optional[bool] = False,
                                    return_batestatus: Optional[bool] = False,
                                    return_metadata: Optional[bool] = False,
                                    return_parameters: Optional[bool] = False,
                                    frequency_options: Optional[dict] = None,
                                    sparks_count: Optional[int] = None
                                    ) -> list:
        """
        Return dataset values (or averages)for named datasets (in one or more datasources) for a single date.
        https://www.idatamedia.org/api-docs#getdatasetvaluesforadate
        """

        payload = {
            "SessionToken": session_token if session_token else self.session_token,
            "Series[]": series,
            "Date": date,
            "ReturnLatest": str(return_latest).lower(),
            "ReturnCorrections": str(return_corrections).lower(),
            "DateFormat": date_format,
            "Rounding": rounding,
            "Frequency": frequency,
            "ReturnAccess": str(return_access).lower(),
            "ReturnBateNames": str(return_batenames).lower(),
            "ReturnBateStatus": str(return_batestatus).lower(),
            "ReturnMetadata": str(return_metadata).lower(),
            "ReturnParameters": str(return_parameters).lower(),
        }

        if sparks_count:
            payload['SparksCount'] = sparks_count
        
        if frequency_options:
            payload['FrequencyOptions'] = frequency_options

        resp = self.__api_call("GetValuesForDate", payload, "POST")
        if resp:
            return resp

    @session_manager
    @help_manager
    def get_my_account_details(self):
        """
        Return registered user account details including API key.
        https://www.idatamedia.org/api-docs#getmyaccountdetails
        """
        payload = {
            "SessionToken": self.session_token,
        }

        self.__m("Retrieving account details.")
        resp = self.__api_call("GetAccountDetails", payload)
        if resp:
            self.__m("Account details retrieved.")

            return resp

    @session_manager
    @help_manager
    def request_new_api_key(self):
        """
        Return a new API key (the current one will be invalidated!).
        https://www.idatamedia.org/api-docs#newapikey
        """
        payload = {
            "SessionToken": self.session_token,
        }

        self.__m("Requesting new API Key...")
        resp = self.__api_call("RequestNewAPIKey", payload)
        if resp:
            new_api_key = resp.get("APIkey", None)

            self.__m("New API Key returned. {}.".format(new_api_key))
            self.API_KEY = new_api_key
            self.__m("New API Key was reset to default")
            return new_api_key

    @session_manager
    @help_manager
    def send_reset_password(self, email):
        """
        Request to reset your password using an emailed link.
        https://www.idatamedia.org/api-docs#resetpassword
        """
        payload = {
            "Email": email,
        }

        self.__m("Resetting password...")
        resp = self.__api_call("SendPasswordReset", payload)
        if resp:
            status_code = resp.get("Status", None)
            detail = resp.get("Detail", None)

            if status_code == 200:
                self.__m("Password reset successful. {}".format(detail))
            else:
                self.__m("Password reset failed. {}".format(detail))
            return detail
