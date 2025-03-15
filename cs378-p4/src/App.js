import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [representative, setRepresentative] = useState('Nancy Pelosi'); // Default representative
  const [error, setError] = useState('');
  const [customRepresentatives, setCustomRepresentatives] = useState([]);
  const [repInput, setRepInput] = useState('');

  // API Endpoint
  const allTransactionsEndpoint =
    'https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json';

  // Default representatives
  const defaultRepresentatives = ['Nancy Pelosi', 'Ro Khanna', 'Dan Crenshaw'];

  // Fetch transactions for the selected representative
  const fetchTransactions = async (repName) => {
    try {
      setError('');
      const response = await fetch(allTransactionsEndpoint);
      if (!response.ok) throw new Error('Failed to fetch transactions.');
      const data = await response.json();

      // Filter transactions for the selected representative
      let filteredTransactions = data.filter(
        (transaction) => transaction.representative.toLowerCase() === repName.toLowerCase()
      );

      if (filteredTransactions.length === 0) {
        throw new Error(`No transactions found for "${repName}". Please enter a valid representative.`);
      }

      // Remove duplicate stock tickers and sort by transaction amount (highest to lowest)
      const uniqueTransactions = [];
      const seenTickers = new Set();

      filteredTransactions.forEach((transaction) => {
        if (!seenTickers.has(transaction.ticker)) {
          seenTickers.add(transaction.ticker);
          uniqueTransactions.push(transaction);
        }
      });

      uniqueTransactions.sort((a, b) => {
        const amountA = parseFloat(a.amount.replace('$', '').replace(',', '')) || 0;
        const amountB = parseFloat(b.amount.replace('$', '').replace(',', '')) || 0;
        return amountB - amountA; // Sort descending by transaction amount
      });

      setTransactions(uniqueTransactions);
    } catch (err) {
      setTransactions([]); // Clear transactions if none are found
      setError(err.message);
    }
  };

  // Handle representative button click
  const handleRepClick = (repName) => {
    setRepresentative(repName);
    fetchTransactions(repName);
  };

  // Handle custom representative addition via input + button
  const handleAddRepresentative = () => {
    if (!repInput.trim()) {
      setError('Please enter a valid representative name.');
      return;
    }

    setCustomRepresentatives([...customRepresentatives, repInput.trim()]);
    handleRepClick(repInput.trim());
    setRepInput('');
  };

  // Load default representative's transactions on initial render
  useEffect(() => {
    handleRepClick('Nancy Pelosi');
  }, []);

  // Prepare data for visualization (Bar Chart)
  const barChartData = {
    labels: transactions.map((transaction) => transaction.ticker),
    datasets: [
      {
        label: 'Transaction Amount ($)',
        data: transactions.map((transaction) =>
          parseFloat(transaction.amount.replace('$', '').replace(',', '')) || 0
        ),
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        maxBarThickness: 30, // Ensures consistent bar size
      },
    ],
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ color: '#4CAF50', marginBottom: '20px' }}>House Stock Watcher</h1>

      {/* Representative Buttons */}
      <div>
        {defaultRepresentatives.map((rep) => (
          <button
            key={rep}
            onClick={() => handleRepClick(rep)}
            style={{
              marginRight: '10px',
              padding: '10px',
              backgroundColor: representative === rep ? '#4CAF50' : '#f0f0f0',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {rep}
          </button>
        ))}
        {customRepresentatives.map((customRep) => (
          <button
            key={customRep}
            onClick={() => handleRepClick(customRep)}
            style={{
              marginRight: '10px',
              padding: '10px',
              backgroundColor: representative === customRep ? '#4CAF50' : '#f0f0f0',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {customRep}
          </button>
        ))}
      </div>

      {/* Input Field and Add Button */}
      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', maxWidth: '400px' }}>
        <input
          type="text"
          value={repInput}
          onChange={(e) => setRepInput(e.target.value)}
          placeholder="Enter Representative Name"
          style={{ padding: '10px', flexGrow: 1 }}
        />
        <button onClick={handleAddRepresentative} style={{ padding: '10px', marginLeft: '10px', cursor: 'pointer' }}>
          +
        </button>
      </div>

      {/* Error Message */}
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

      {/* Transactions Visualization */}
      <div style={{ marginTop: '20px', height: "500px", width:"100%" }}>
        <h2>{representative ? `Stock Transactions for ${representative}` : ''}</h2>
        {transactions.length > 0 ? (
          <Bar
            data={barChartData}
            options={{
              indexAxis: 'y', // Horizontal orientation
              plugins: {
                legend: { display: false }, // Hide legend for simplicity
                tooltip: { callbacks: { label: (context) => `$${context.raw.toLocaleString()}` } },
              },
              responsive:true,
              maintainAspectRatio:false,
              scales:{
                x:{
                  ticks:{beginAtZero:true},
                },
                y:{
                  ticks:{font:{size:"12"}},
                }
              }
            }}
          />
        ) : (
          representative && <p>No transactions found for {representative}.</p>
        )}
      </div>

      {/* Recent Transactions Section */}
      <div style={{ marginTop: "6%" }}>
        <h3>Recent Great Buys</h3>
        <table style={{ width:"100%", borderCollapse:"collapse", marginTop:"15px" }}>
          <thead>
            <tr style={{ backgroundColor:"#f0f0f0", textAlign:"left" }}>
              <th style={{ padding:"10px", borderBottom:"2px solid #ddd" }}>Stock</th>
              <th style={{ padding:"10px", borderBottom:"2px solid #ddd" }}>Amount</th>
              <th style={{ padding:"10px", borderBottom:"2px solid #ddd" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0,5).map((transaction,index)=>(
              <tr key={index} style={{ borderBottom:"1px solid #ddd" }}>
                <td style={{ padding:"10px" }}>{transaction.ticker}</td>
                <td style={{ padding:"10px" }}>{transaction.amount}</td>
                <td style={{ padding:"10px" }}>{transaction.transaction_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
