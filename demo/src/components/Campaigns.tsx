import React from 'react';
import { map, sortBy } from 'lodash';

import Campaign from './Campaign';
import { AllCampaigns } from '../types';
const campaigns: AllCampaigns = require('../assets/allCampaigns.json');

export default class Campaigns extends React.Component {
  render() {
    return (
      <div>
        { map(
            sortBy(campaigns, campaign => campaign.campaign.position), 
            (campaign, idx) => (
            <Campaign key={idx} campaign={campaign} />
          )) }
      </div>
    );
  }
}
