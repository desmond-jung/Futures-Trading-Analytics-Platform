import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import './Calendar.css';

function TradingCalendar(){

    // state for tracking selected date
    const [date, setDate] = useState(new Date());

    // store daily pnl data
    const [dailyPnL, setDailyPnL] = useState({});

    // state track if we're loading data
    const [loading, setLoading] = useState(true);

    // modal open
    const [isModalOpen, setIsModalOpen] = useState(false);

    // date selected
    const [selectedDate, setSelectedDate] = useState(null);

    // trades for each day
    const [selectedTrades, setSelectedTrades] = useState([])

    // state: Track trade type changes before saving
    const [tradeTypeUpdates, setTradeTypeUpdates] = useState({});

    // fetch data when component loads
    useEffect(() =>{
        fetchDailyPnL()
    }, []); // empty means run when component loads
    
    // function fetch daily pnl from flask
    const fetchDailyPnL = async () => {
        try {
            // get request to flask
            const response = await axios.get('http://localhost:5001/api/pnl/daily')

            const pnlMap = {};

            response.data.data.forEach(day=> {
                pnlMap[day.date] = day;
            });

            // update states
            setDailyPnL(pnlMap);
            setLoading(false);

            console.log('Daily PnL data:', pnlMap);

        }  catch (error){
            console.error('Error fetching daily PnL:', error);
            setLoading(false);
        }

    };


    // functino to handle when user clicks on date
    const handleDateChange = async (selectedDate) => {
        console.log("User clicked:", selectedDate);

        // updates state with new date
        setDate(selectedDate);

        const dateStr = selectedDate.toISOString().split('T')[0];
        setSelectedDate(dateStr);

        // fetch trades for the date
        try{
            const response = await axios.get(`http://localhost:5001/api/trades`, {
                params: {
                    start_date: `${dateStr}T00:00:00`,
                    end_date: `${dateStr}T23:59:59`
                }
            });

            // Filter trades to the day incase API sends additional
            const dayTrades = response.data.trades.filter(trade=>{
                const tradeDate = trade.exit_time.split('T')[0]
                return tradeDate === dateStr;
            });

            setSelectedTrades(dayTrades)

            console.log(`Found ${dayTrades.length} trades for ${dateStr}:`, dayTrades);
        } catch(error){
            console.error('Error fetching trades')
            setSelectedTrades([])
        }

        // open modal
        setIsModalOpen(true);
    };

    // loading message while fetching
    if (loading) {
        return (
            <div style = {{padding: '20px'}}>
                <h1>Trading Journal Calendar</h1>
                <p>Loading calendar data...</p>
            </div>
        );
    }

    const tileContent = ({ date: tileDate, view}) => {
        // only add content on month view
        if (view !== "month") return null;

        // convert tile date to yyy-mm--dd
        const dateStr = tileDate.toISOString().split("T")[0];

        // days pnl
        const dayData = dailyPnL[dateStr];

        console.log("tileContent:", dateStr, dayData);

        if (!dayData) return null;

        const pnl = dayData.pnl;
        const color = pnl >= 0 ? "green" : "red"

        return (
            <div style = {{color, fontSize: "10px", marginTop: "4px"}}>
                ${pnl.toFixed(2)}
            </div>
        );
    };

    const handleTradeTypeChange = (tradeId, newType) => {
        setTradeTypeUpdates(prev => ({
            ...prev,
            [tradeId]: newType
        }));
    }

    const saveTradeTypeChanges = async () => {
        // get all trade ids that have updates
        const updates = Object.entries(tradeTypeUpdates);

        if (updates.length === 0){
            alert('No changes to save');
            return;
        }

        try {
            const promises = updates.map(([tradeId, newType]) =>
                axios.patch(`http://localhost:5001/api/trades/${tradeId}`, {
                    trade_type: newType
                })
            );
            // wait for updates to complete
            await Promise.all(promises);

            setTradeTypeUpdates({});

            // refresh trades list
            const dateStr = selectedDate;
            const response = await axios.get('http://localhost:5001/api/trades', {
                params: {
                    start_date: `${dateStr}T00:00:00`,
                    end_date: `${dateStr}T23:59:59`
                }
            });
            
            const dayTrades = response.data.trades.filter(trade => {
                const tradeDate = trade.exit_time.split('T')[0];
                return tradeDate === dateStr;
            });
            
            setSelectedTrades(dayTrades);
            
            alert('Trade types saved successfully!');
            
        } catch (error) {
            console.error('Error saving trade types:', error);
            alert('Failed to save trade types. Please try again.');
        }
    };

    // Function: Calculate monthly statistics from daily PnL data
    const calculateMonthlyStats = () => {
        // Get all days with data
        const days = Object.values(dailyPnL);
        
        if (days.length === 0) {
            return {
                totalProfit: 0,
                totalLoss: 0,
                netPnL: 0,
                daysTracked: 0,
                avgDailyNet: 0,
                profitMargin: 0,
                winningDays: 0,
                losingDays: 0
            };
        }
        
        // Calculate totals
        let totalProfit = 0;
        let totalLoss = 0;
        let winningDays = 0;
        let losingDays = 0;
        
        days.forEach(day => {
            if (day.pnl > 0) {
                totalProfit += day.pnl;
                winningDays += 1;
            } else if (day.pnl < 0) {
                totalLoss += Math.abs(day.pnl);  // Make it positive for display
                losingDays += 1;
            }
        });
        
        const netPnL = totalProfit - totalLoss;
        const daysTracked = days.length;
        const avgDailyNet = daysTracked > 0 ? netPnL / daysTracked : 0;
        const profitMargin = daysTracked > 0 ? (winningDays / daysTracked) * 100 : 0;
        
        return {
            totalProfit,
            totalLoss,
            netPnL,
            daysTracked,
            avgDailyNet,
            profitMargin,
            winningDays,
            losingDays
        };
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'row',
            gap: '30px',
            padding: '20px',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* Left Column - Calendar */}
            <div style={{ flex: '3' }}>
                <h1>Trading Journal Calendar</h1>
                {/* show currently selected date */}
                <p style={{ fontSize: '20px', marginBottom: '20px' }}>
                    Selected Date: {date.toLocaleDateString()}
                </p>

                {/* show total pnl if theres data */}
                {Object.keys(dailyPnL).length > 0 && (
                    <p style={{ fontSize: '16px', marginBottom: '20px', color: 'green'}}>
                        Total PnL: ${Object.values(dailyPnL).reduce((sum,day) => sum + day.pnl, 0).toFixed(2)}
                    </p>
                )}
                
                {/* pass handler function*/} 
                <Calendar 
                    onChange={handleDateChange}
                    value={date}
                    tileContent={tileContent}
                />
                {/* Display the raw data for debugging (we'll remove this later) */}
                <div style={{ marginTop: '30px' }}>
                    <h2>Daily PnL Data (for debugging):</h2>
                    <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                        {JSON.stringify(dailyPnL, null, 2)}
                    </pre>
                </div>
            </div>

            {/* Right Column - Summary Panels */}
            <div style={{ flex: '1', minWidth: '250px' }}>
                {/* Monthly Summary Panel */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#212529' }}>
                        Monthly Summary
                    </h2>
                    
                    {(() => {
                        const stats = calculateMonthlyStats();
                        return (
                            <>
                                {/* Total Profit */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '0.95em' }}>Total Profit</span>
                                    <span style={{ 
                                        color: '#2b8a3e', 
                                        fontWeight: '600', 
                                        fontSize: '1.1em' 
                                    }}>
                                        ${stats.totalProfit.toFixed(2)}
                                    </span>
                                </div>
                                
                                {/* Total Loss */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '0.95em' }}>Total Loss</span>
                                    <span style={{ 
                                        color: '#c92a2a', 
                                        fontWeight: '600', 
                                        fontSize: '1.1em' 
                                    }}>
                                        ${stats.totalLoss.toFixed(2)}
                                    </span>
                                </div>
                                
                                {/* Net PnL */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 0',
                                    marginTop: '8px',
                                    borderTop: '2px solid #e9ecef',
                                    borderBottom: '2px solid #e9ecef'
                                }}>
                                    <span style={{ 
                                        color: '#212529', 
                                        fontSize: '1em', 
                                        fontWeight: '600' 
                                    }}>
                                        Net P&L
                                    </span>
                                    <span style={{ 
                                        color: stats.netPnL >= 0 ? '#2b8a3e' : '#c92a2a', 
                                        fontWeight: '700', 
                                        fontSize: '1.3em' 
                                    }}>
                                        ${stats.netPnL.toFixed(2)}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Monthly Statistics Panel */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#212529' }}>
                        Monthly Statistics
                    </h2>
                    
                    {(() => {
                        const stats = calculateMonthlyStats();
                        return (
                            <>
                                {/* Days Tracked */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '0.95em' }}>Days Tracked</span>
                                    <span style={{ 
                                        color: '#212529', 
                                        fontWeight: '600', 
                                        fontSize: '1.1em' 
                                    }}>
                                        {stats.daysTracked}
                                    </span>
                                </div>
                                
                                {/* Average Daily Net */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '0.95em' }}>Avg Daily Net</span>
                                    <span style={{ 
                                        color: stats.avgDailyNet >= 0 ? '#2b8a3e' : '#c92a2a', 
                                        fontWeight: '600', 
                                        fontSize: '1.1em' 
                                    }}>
                                        ${stats.avgDailyNet.toFixed(2)}
                                    </span>
                                </div>
                                
                                {/* Profit Margin */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '0.95em' }}>Profit Margin</span>
                                    <span style={{ 
                                        color: '#212529', 
                                        fontWeight: '600', 
                                        fontSize: '1.1em' 
                                    }}>
                                        {stats.profitMargin.toFixed(1)}%
                                    </span>
                                </div>
                                
                                {/* Winning Days */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '0.95em' }}>Winning Days</span>
                                    <span style={{ 
                                        color: '#2b8a3e', 
                                        fontWeight: '600', 
                                        fontSize: '1.1em' 
                                    }}>
                                        {stats.winningDays}
                                    </span>
                                </div>
                                
                                {/* Losing Days */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0'
                                }}>
                                    <span style={{ color: '#6c757d', fontSize: '0.95em' }}>Losing Days</span>
                                    <span style={{ 
                                        color: '#c92a2a', 
                                        fontWeight: '600', 
                                        fontSize: '1.1em' 
                                    }}>
                                        {stats.losingDays}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Modal - only if ismodalopen is true */}
            {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '10px',
                            maxWidth: '500px',
                            width: '90%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>
                            {selectedDate ? new Date(selectedDate).toLocaleDateString(): 'Trade Details'}
                        </h2>
                        <p>PEE PEE POOO POO ABBY IS A DOO DOO</p>
                        <button onClick={() => setIsModalOpen(false)}>
                            Close
                        </button>

                        {/* Trades List */}
                        <div style={{ marginTop: '20px' }}>
                            <h3>Trades</h3>
                            {selectedTrades.length === 0 ? (
                                <p>No trades for this date.</p>
                            ) : (
                                <div>
                                    {selectedTrades.map(trade => {
                                        // Get current trade type (from update or original)
                                        const currentType = tradeTypeUpdates[trade.id] || trade.trade_type || 'day_trade';
                                        
                                        return (
                                            <div 
                                                key={trade.id}
                                                style={{
                                                    padding: '12px',
                                                    marginBottom: '10px',
                                                    backgroundColor: trade.pnl >= 0 ? '#f0f9f0' : '#fff0f0',
                                                    borderRadius: '5px',
                                                    borderLeft: `4px solid ${trade.pnl >= 0 ? 'green' : 'red'}`
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div>
                                                        <strong>{trade.symbol}</strong> - {trade.direction}
                                                    </div>
                                                    <div style={{ 
                                                        color: trade.pnl >= 0 ? 'green' : 'red',
                                                        fontWeight: 'bold',
                                                        fontSize: '18px'
                                                    }}>
                                                        ${trade.pnl.toFixed(2)}
                                                    </div>
                                                </div>
                                                
                                                {/* Trade Type Dropdown */}
                                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <label style={{ fontSize: '0.9em', color: '#6c757d' }}>Type:</label>
                                                    <select
                                                        value={currentType}
                                                        onChange={(e) => handleTradeTypeChange(trade.id, e.target.value)}
                                                        style={{
                                                            padding: '6px 10px',
                                                            borderRadius: '5px',
                                                            border: '1px solid #dee2e6',
                                                            fontSize: '0.9em',
                                                            backgroundColor: 'white',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="day_trade">Day Trade</option>
                                                        <option value="swing">Swing</option>
                                                        <option value="long_term">Long Term</option>
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Save button - only show if there are changes */}
                    {Object.keys(tradeTypeUpdates).length > 0 && (
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setTradeTypeUpdates({}); // Clear changes
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    border: '1px solid #dee2e6',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveTradeTypeChanges}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: '#4dabf7',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TradingCalendar;
