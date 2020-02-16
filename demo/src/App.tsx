import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams,
} from 'react-router-dom';

import Campaigns from './components/Campaigns';
import CampaignDetail from './components/CampaignDetail';
import CampaignScenarioDetail from './components/CampaignScenarioDetail';

import logo from './logo.svg';
import './App.css';

function CampaignRoute() {
  let { campaignId } = useParams();
  if (!campaignId) {
    return null;
  }
  return (
    <CampaignDetail campaignId={campaignId} />
  )
}

function CampaignScenarioRoute() {
  let { campaignId, scenarioId } = useParams();
  if (!campaignId || !scenarioId) {
    return null;
  }

  return (
    <CampaignScenarioDetail
      campaignId={campaignId}
      scenarioId={scenarioId}
    />
  );
}

function DefaultRoute() {
  return <Campaigns />;
}

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Arkham Cards</h1>
      <Router>
        <Switch>
          <Route path="/campaign/:campaignId/:scenarioId">
            <CampaignScenarioRoute />
          </Route>
         <Route path="/campaign/:campaignId">
           <CampaignRoute />
         </Route>
         <Route>
           <DefaultRoute />
         </Route>
       </Switch>
     </Router>
    </div>
  );
}

export default App;
