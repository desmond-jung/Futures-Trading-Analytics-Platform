"""
Contract multipliers for futures contracts.

Each contract has a dollar value per point move.
Example: MNQ moving 1 point = $2, MGC moving 1 point = $10
"""

# Map contract symbol (root) to dollar value per point
CONTRACT_MULTIPLIERS = {
    # Micro E-mini contracts
    'MNQ': 2.0,      # Micro E-mini NASDAQ-100
    'MES': 5.0,      # Micro E-mini S&P 500
    'MYM': 0.5,      # Micro E-mini Dow
    'M2K': 1.0,     # Micro Russell 2000
    
    # E-micro contracts
    'MGC': 10.0,     # E-micro Gold
    'MCL': 10.0,     # E-micro Crude Oil
    'M6E': 1.25,    # E-micro Euro FX
    
    # Full-size contracts (if you trade them)
    'NQ': 20.0,      # E-mini NASDAQ-100
    'ES': 50.0,      # E-mini S&P 500
    'GC': 100.0,     # Gold
    'CL': 100.0,     # Crude Oil
    
    # Add more as needed
}

def get_contract_multiplier(contract_symbol: str) -> float:
    """
    Get the dollar value per point for a contract.
    
    Args:
        contract_symbol: Contract symbol (e.g., 'MGCG6', 'MNQH6', 'MES')
                         Can include expiration (MGCG6) or just root (MGC)
    
    Returns:
        Dollar value per point (default: 1.0 if unknown)
    
    Examples:
        get_contract_multiplier('MGCG6') -> 10.0
        get_contract_multiplier('MNQH6') -> 2.0
        get_contract_multiplier('UNKNOWN') -> 1.0
    """
    if not contract_symbol:
        return 1.0
    
    # Extract root symbol (remove expiration month/year)
    # Examples: 'MGCG6' -> 'MGC', 'MNQH6' -> 'MNQ', 'MES' -> 'MES'
    root = contract_symbol.upper()
    
    # Remove trailing digits/letters that represent expiration
    # Contract format: ROOT + MONTH_CODE + YEAR
    # Examples: MGCG6 (MGC + G + 6), MNQH6 (MNQ + H + 6), MESM24 (MES + M + 24)
    import re
    # Pattern: Match root (2-4 letters) followed by month code (1 letter) and year (1-2 digits)
    # Or just match root if no expiration code
    match = re.match(r'^([A-Z]{2,4})(?:[A-Z]\d{1,2})?$', root)
    if match:
        root = match.group(1)
    else:
        # Fallback: try to extract just the letters before any digits
        match = re.match(r'^([A-Z]+)', root)
        if match:
            # If we got something like 'MGCG', try common roots
            potential_root = match.group(1)
            # Check if a shorter prefix exists in our dict
            for i in range(len(potential_root), 1, -1):
                candidate = potential_root[:i]
                if candidate in CONTRACT_MULTIPLIERS:
                    root = candidate
                    break
            else:
                root = potential_root
    
    # Look up multiplier
    multiplier = CONTRACT_MULTIPLIERS.get(root, 1.0)
    
    return multiplier