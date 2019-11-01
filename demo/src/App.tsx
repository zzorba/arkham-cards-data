import React from 'react';
import Campaigns from './components/Campaigns';
import logo from './logo.svg';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Arkham Cards</h1>
      <Campaigns />
    </div>
  );
}

export default App;
