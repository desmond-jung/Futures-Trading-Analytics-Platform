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

def get_fills():
    headers = get_headers()

    url = 'https://demo.tradovateapi.com/v1/fill/list'

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        fills = response.json()
        print(f"Success: Got {len(fills)} fills")

        # show first fill to see schema
        if len(fills) > 0:
            import json
            print("Fill schema")
            print(json.dumps(fills, indent=2))
        else:
            print("No fills found")
        
        return fills[-1]
    else:
        print(f"Error: {response.text}")
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
    # Call GET /v1/order/list. Optional query param ord_status (e.g. "Filled") to filter by ordStatus. Return list of order objects. Use for bracket/OCO structure (parentId, linkedId, ocoId).
    """"
    Canceled" "Completed" "Expired" "Filled" "PendingCancel" 
    "PendingNew" "PendingReplace" "Rejected" "Suspended" "Unknown" "Working"
    """

    headers = get_headers()
    url = 'https://demo.tradovateapi.com/v1/order/list'

    params = {}
    if ord_status:
        params["ordStatus"] = ord_status

    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        print("Error:", response.text)
        return None
 
    import json
    data = response.json()
    print(json.dumps(data[-3:]))

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
    if authenticate():
        print("Token stored")
        get_fills()
        # get_fills()