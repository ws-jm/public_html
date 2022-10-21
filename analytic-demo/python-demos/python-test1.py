from class_source.idata_client import IData



@requires_authorization(roles=["ADMIN"])
def somefunc(param1='', param2=0):
    r'''A docstring'''
    if param1 > param2: # interesting
        print 'Gre\'ater'
    return (param2 - param1 + 1 + 0b10l) or None

class SomeClass:
    pass

>>> message = '''interpreter
... prompt'''



API_KEY = "RMFZH-X108C-L5SKB-4O9UN"
INVALID_API_KEY = "FAKES-FAKES"
VALID_SESSION_TOKEN = "9d3ff2d7cd06e1474ad970e8c162f2ae"


# Test Case 0: Try to create a class instance without API_KEY
# idata = IData()

# Test Case 1: Try to create instance with invalid api key
#idata = IData(api_key=INVALID_API_KEY)

# Test Case 2: Create an instance with API_KEY
#idata = IData(api_key=API_KEY)

# Test Case 3: Create instance with API_KEY and session token
#idata = IData(api_key=API_KEY, session_token=VALID_SESSION_TOKEN)

# Test Case 4: Create instance with verbose enabled
#idata = IData(api_key=API_KEY, verbose=True)

# Test Case 5: Create instance print response output enabled
#idata = IData(api_key=API_KEY, raw=True)

# Test Case 6: Create instance with verbose and print response enabled
idata = IData(api_key=API_KEY, verbose=True, raw=True)

# Test Case 7: Request session token
idata.get_session_token()

# Test Case 8: Request expiration milliseconds for session token
idata.session_token_expires_in()

# Test Case 9: Extend session token expiration
idata.renew_session_token()

# Test Case 10: Revoke session token
#idata.revoke_session_token()

# Test Case 11: Retrieve datasource. This endpoint no longer work apperently.
idata.get_datasource("")

# Test Case 12: Retrieve all datasources
idata.get_all_datasources()

# Test Case 13: Retrieve user datasources
idata.get_user_datasources()

# Test Case 14: Retrieve datasets metadata
idata.get_dataset_of("ECBFX")

# Test Case 15: Retrieve given datasets metadata. One valid, one invalid datasource given.
idata.get_datasets(["ECBFX/EURGBP", "ECBFX7/EURCAD"])

# Test Case 16: Retrieve how many favorites exist
idata.get_favorites_status()

# Test Case 17: Retrieve user's favorites
idata.get_favorites()

# Test Case 18: Add to favorites list. One valid, one invalid datasource given.
idata.add_favorites(["ECBFX/EURGBP", "ECBFX7/EURCAD"])

# Test Case 19: Remove from favorites list. One valid, one invalid datasource given.
idata.del_favorites(["ECBFX/EURGBP", "ECBFX7/EURCAD"])

# Test Case 20: Retrieve dataset values. One valid, one invalid datasource given.
idata.get_dataset_values(["ECBFX/EURGBP", "ECBFX7/EURCAD"])

# Test Case 21: Retrieve dataset values row by column. One valid, one invalid datasource given.
idata.get_dataset_values(["ECBFX/EURGBP", "ECBFX7/EURCAD"], rc=True)

# Test Case 22: Retrieve dataset values for a certain date. One valid, one invalid datasource given.
idata.get_dataset_values_for_date(["ECBFX/EURGBP", "ECBFX7/EURCAD"], date="2018-07-01")

# Test Case 23: Retrieve account details
idata.get_account_details()

# Test Case 24: Request new api key
#idata.request_new_api_key()

# Test Case 25: Reset password
#idata.reset_password()

# Test Case 26: Test help menu
idata.get_session_token("?")
idata.revoke_session_token("?")
idata.get_dataset_values_for_date("?")

# Test Case 27: Disable verbose
idata.verbose = False

# Test Case 28: Disable print response
idata.raw = False

# Test Case 29: If new endpoint added
payload = {
    "SessionToken": "",
    "ExtraDetails": "",
}
endpoint = "NewEndpoint"
idata.api_call(endpoint, payload)

