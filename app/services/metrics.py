from datetime import datetime, timedelta

def detect_trade_type(entry_time, exit_time):
    """
    - same day entry and exit - day trade
    - mulit day but closed - swing
    - still open = swing (default)
    - user can edit to long term manually
    """

    if not entry_time or not exit_time:
        return 'swing'

    # convert to dates with timestamps
    entry_date = entry_time.date() if isinstance(entry_time, datetime) else entry_time
    exit_date = exit_time.date() if isinstance(exit_time, datetime) else exit_time

    if entry_date == exit_date: 
        return 'day_trade'
    
    if isinstance(exit_time, datetime) and exit_time > datetime.now():
        return 'swing'
    
    return 'swing'