import requests
import uuid

access_token = None

def authenticate():
    global access_token

    username = "Google:115790771135467284232"
    password = "Djm0nd!23"  

    url = "https://demo.tradovateapi.com/v1/auth/accesstokenrequest"

    body = {
    "name": username,
    "password": password,
    "appId": "tradovate",  # Changed from "TradingJournal"
    "appVersion": "0.0.1",  # Changed from "1.0"
    "deviceId": str(uuid.uuid4()),
    "cid": "9574",  # Changed to string
    "sec": "94bbf03e-a583-4df7-b96e-78df5500f5b8"
    }

    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }

    print("Authenticating...")
    response = requests.post(url, json=body, headers = headers)

    if response.status_code == 200:
        data = response.json()
        access_token = data.get('accessToken')
        print("Authenticated! Token saved")
        return True
    else:
        print(f"Failed{response.json()}")
        return False
    
def get_headers():
        if not access_token:
            raise Exception("Not authenticated")
        return {
            "Authorization": f"Bearer {access_token}",
            "accept": "application/json",
            "Content-Type": "application/json"
        }

def get_accounts():
    """
    Get list of accounts for the authenticated user.
    This might be needed to get the correct account ID for fills/orders.
    
    Returns:
        List of account dictionaries, or None if error
    """
    try:
        headers = get_headers()
    except Exception as e:
        print(f"❌ Error getting headers: {str(e)}")
        return None
    
    url = 'https://demo.tradovateapi.com/v1/account/list'
    
    try:
        print(f"🔍 DEBUG: Fetching accounts from {url}")
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            accounts = response.json()
            
            # Handle dict response
            if isinstance(accounts, dict):
                if 'data' in accounts:
                    accounts = accounts['data']
                elif 'accounts' in accounts:
                    accounts = accounts['accounts']
                else:
                    print(f"⚠️  DEBUG: Unexpected accounts response format: {list(accounts.keys())}")
                    return None
            
            if isinstance(accounts, list):
                print(f"✅ DEBUG: Found {len(accounts)} accounts")
                for acc in accounts:
                    acc_id = acc.get('id') or acc.get('accountId') or acc.get('name')
                    acc_name = acc.get('name') or acc.get('accountName') or 'Unknown'
                    print(f"  - Account ID: {acc_id}, Name: {acc_name}")
                return accounts
            else:
                print(f"⚠️  DEBUG: Accounts response is not a list: {type(accounts)}")
                return None
        else:
            print(f"❌ Error fetching accounts: Status {response.status_code}, {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception fetching accounts: {str(e)}")
        import traceback
        traceback.print_exc()
        return None   

def get_fills(account_id=None):
    """
    Get all fills from Tradovate API.
    
    Args:
        account_id: Optional account ID to filter fills (some APIs require this)
    
    Returns:
        List of fill dictionaries, or empty list if error
    """
    try:
        headers = get_headers()
    except Exception as e:
        print(f"❌ Error getting headers (not authenticated?): {str(e)}")
        return []
    
    url = 'https://demo.tradovateapi.com/v1/fill/list'
    
    # Try with account filter if provided
    params = {}
    if account_id:
        params['accountId'] = account_id
        print(f"🔍 DEBUG: Requesting fills for account: {account_id}")

    try:
        print(f"🔍 DEBUG: Calling {url} with params: {params}")
        response = requests.get(url, headers=headers, params=params if params else None, timeout=10)
        
        print(f"🔍 DEBUG: Response status: {response.status_code}")
        print(f"🔍 DEBUG: Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            fills = response.json()
            
            # Debug: Check what type we got
            print(f"🔍 DEBUG: Response type: {type(fills)}")
            print(f"🔍 DEBUG: Response length (if list): {len(fills) if isinstance(fills, list) else 'N/A'}")
            
            # If it's a dict, check for common keys
            if isinstance(fills, dict):
                print(f"🔍 DEBUG: Response dict keys: {list(fills.keys())}")
                # Some APIs return {'data': [...]} or {'fills': [...]}
                if 'data' in fills:
                    fills = fills['data']
                elif 'fills' in fills:
                    fills = fills['fills']
                elif 'items' in fills:
                    fills = fills['items']
            
            # Ensure it's a list
            if not isinstance(fills, list):
                print(f"⚠️  DEBUG: Response is not a list, got: {type(fills)}")
                print(f"🔍 DEBUG: Full response: {fills}")
                return []
            
            print(f"✅ Success: Got {len(fills)} fills from Tradovate API")

            # show first fill to see schema
            if len(fills) > 0:
                import json
                print("📋 Fill schema (first fill):")
                print(json.dumps(fills[0], indent=2))
                
                # Check if fills have accountId and show distribution
                account_ids = [f.get('accountId') for f in fills if f.get('accountId')]
                if account_ids:
                    from collections import Counter
                    account_counts = Counter(account_ids)
                    print(f"📊 DEBUG: Fills by account: {dict(account_counts)}")
            else:
                print("⚠️  No fills found in Tradovate account")
                print("🔍 DEBUG: Trying to get filled orders instead...")
                
                # Alternative: Try getting filled orders
                filled_orders = get_orders_list(ord_status="Filled")
                if filled_orders:
                    print(f"📋 DEBUG: Found {len(filled_orders)} filled orders")
                    print("💡 DEBUG: You may need to get fills for specific order IDs")
            
            return fills
        else:
            print(f"❌ Error fetching fills: Status {response.status_code}")
            print(f"🔍 DEBUG: Response text: {response.text[:500]}")
            return []
    except Exception as e:
        print(f"❌ Exception fetching fills: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def get_fill_dependents(order_id: int):
    """call filldependents for one order ID"""

    headers = get_headers()
    
    url = 'https://demo.tradovateapi.com/v1/fill/deps'

    params = {
        "masterid": order_id
    }

    print(f"Calling fillDependents for {order_id}")

    response = requests.get(url, headers=headers, params=params)
    print("Status:", response.status_code)

    try:
        data = response.json()
    except Exception:
        print("Non-JSON response:", response.text)
        return None
    import json
    print(json.dumps(data if isinstance(data, dict) else data[:2], indent=2))
    return data
    
def get_orders_list(ord_status = None):
    """
    Call GET /v1/order/list. Optional query param ord_status (e.g. "Filled") to filter by ordStatus. 
    Return list of order objects. Use for bracket/OCO structure (parentId, linkedId, ocoId).
    
    Status values: "Canceled", "Completed", "Expired", "Filled", "PendingCancel", 
    "PendingNew", "PendingReplace", "Rejected", "Suspended", "Unknown", "Working"
    
    Returns:
        List of order dictionaries, or None if error
    """
    try:
        headers = get_headers()
    except Exception as e:
        print(f"❌ Error getting headers: {str(e)}")
        return None

    url = 'https://demo.tradovateapi.com/v1/order/list'

    params = {}
    if ord_status:
        params["ordStatus"] = ord_status
        print(f"🔍 DEBUG: Filtering orders by status: {ord_status}")

    try:
        response = requests.get(url, headers=headers, params=params if params else None, timeout=10)

        if response.status_code != 200:
            print(f"❌ Error fetching orders: Status {response.status_code}, {response.text}")
            return None
     
        import json
        data = response.json()
        
        # Ensure it's a list
        if not isinstance(data, list):
            if isinstance(data, dict):
                print(f"🔍 DEBUG: Orders response is dict with keys: {list(data.keys())}")
                if 'data' in data:
                    data = data['data']
                elif 'orders' in data:
                    data = data['orders']
                else:
                    print(f"⚠️  DEBUG: Unexpected orders response format: {data}")
                    return None
            else:
                print(f"⚠️  DEBUG: Unexpected orders response type: {type(data)}")
                return None
        
        print(f"✅ DEBUG: Got {len(data)} orders")
        if len(data) > 0:
            print("📋 DEBUG: Sample order (last 3):")
            print(json.dumps(data[-3:] if len(data) >= 3 else data, indent=2))
        
        return data
    except Exception as e:
        print(f"❌ Exception fetching orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def get_contract_info(contract_id: int):
    """
    Get contract information from Tradovate API using contractId.
    
    Returns:
        Contract symbol (e.g., "MNQH6", "MGCG6") or None if not found
    """
    if not contract_id:
        return None
    print(contract_id)
    headers = get_headers()
    url = f'https://demo.tradovateapi.com/v1/contract/item/{contract_id}'
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            import json
            print(json.dumps(data, indent=2))
            
            # Try different possible field names for contract symbol
            # Common formats: "name", "symbol", "contractName", "rootSymbol"
            contract_symbol = (
                data.get("name") or 
                data.get("symbol") or 
                data.get("contractName") or
                data.get("rootSymbol") or
                None
            )
            
            # If we got something like "MNQ Mar 2026", extract just "MNQH6" or "MNQ"
            if contract_symbol and " " in contract_symbol:
                # Take first part (e.g., "MNQ" from "MNQ Mar 2026")
                contract_symbol = contract_symbol.split()[0]
            
            return contract_symbol
        else:
            print("No contract found")
            return None
    except Exception as e:
        return None

def build_bracket_oco_groups(orders):
    # Take the full list of orders from order/list. Group by parentId (brackets) and by ocoId (OCO). Return a dict: key = group identifier (e.g. "parent:<id>" or "oco:<id>" or "standalone:<id>"), value = list of order IDs in that group. Used so we know which order IDs belong together for fetching fills and pairing entry/exi
    
    if not orders:
        return {}
    
    order_ids = {o.get("id") for o in orders if o.get("id") is not None}
    by_parent = {}
    by_oco = {}
    standalones = []

    for order in orders:
        oid = order.get("id")
        if oid is None:
            continue
        parent_id = order.get("parentId")
        oco_id = order.get("ocoId")

        if parent_id is not None:
            by_parent.setdefault(parent_id, []).append(oid)
        if oco_id is not None:
            by_oco.setdefault(oco_id, []).append(oid)
        if parent_id is not None and oco_id is not None:
            standalones.append(oid)

    groups = {}
    for parent_id, child_ids in by_parent.items():
        ids = list(child_ids)
        if parent_id in order_ids and parent_id not in ids:
            ids.insert(0, parent_id)
        groups[f"parent:{parent_id}"] = ids

    for oco_id, ids in by_oco.items():
        groups[f"oco:{oco_id}"] = list(dict.fromkeys(ids))

    for oid in standalones:
        groups[f"standalone:{oid}"] = [oid]

    return groups


if __name__ == '__main__':
    # Simple manual test harness so you can run:
    #   python -m app.ingestion.tradovate
    # to verify authentication and basic API calls.
    print("="*80)
    print("🧪 TRADOVATE API TEST")
    print("="*80)
    
    if authenticate():
        # Step 1: Get accounts
        print("\n" + "="*80)
        print("👤 Step 1: Getting accounts")
        print("="*80)
        accounts = get_accounts()
        
        # Step 2: Try getting orders without filter
        print("\n" + "="*80)
        print("📋 Step 2: Testing get_orders_list() - ALL orders (no filter)")
        print("="*80)
        all_orders = get_orders_list(ord_status=None)
        
        print("\n" + "="*80)
        print("📋 Step 3: Testing get_orders_list() - FILLED orders only")
        print("="*80)
        filled_orders = get_orders_list(ord_status="Filled")
        
        # Step 3: Try getting fills
        print("\n" + "="*80)
        print("📥 Step 4: Testing get_fills() - without account filter")
        print("="*80)
        fills = get_fills()
        
        # Step 4: Try with account ID if we found accounts
        if accounts and len(accounts) > 0:
            # Try first account
            first_account = accounts[0]
            account_id = first_account.get('id') or first_account.get('accountId')
            
            if account_id:
                print("\n" + "="*80)
                print(f"📥 Step 5: Testing get_fills() - with account ID: {account_id}")
                print("="*80)
                fills_with_account = get_fills(account_id=account_id)
                
                if fills_with_account:
                    print(f"\n✅ Successfully retrieved {len(fills_with_account)} fills with account filter")
        
        # Summary
        print("\n" + "="*80)
        print("📊 SUMMARY")
        print("="*80)
        print(f"  - Accounts found: {len(accounts) if accounts else 0}")
        print(f"  - All orders: {len(all_orders) if all_orders else 0}")
        print(f"  - Filled orders: {len(filled_orders) if filled_orders else 0}")
        print(f"  - Fills (no filter): {len(fills) if fills else 0}")
        
        if not fills and not filled_orders:
            print("\n💡 TROUBLESHOOTING:")
            print("  - The API is returning empty arrays, which could mean:")
            print("    1. This is a demo account with no trading history")
            print("    2. The account needs to be specified explicitly")
            print("    3. There's a date range filter needed (API might only return recent data)")
            print("    4. You might need to use a different endpoint or API version")
            
        print("\n" + "="*80)
        print("📋 Testing get_contract_info()")
        print("="*80)
        get_contract_info(4214197)
    else:
        print("❌ Authentication failed - cannot test API calls")