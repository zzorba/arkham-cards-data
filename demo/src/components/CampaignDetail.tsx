import React from 'react';
import {
  Link,
} from 'react-router-dom';
import { forEach, find, map } from 'lodash';

import { AllCampaigns, FullCampaign, Scenario } from '../types';
import ScenarioListItem from './ScenarioListItem';
const campaigns: AllCampaigns = require('../assets/allCampaigns.json');

interface Props {
  campaignId: string;
}

export default class CampaignDetail extends React.Component<Props> {
  campaign(): FullCampaign | undefined {
    const { campaignId } = this.props;
    return find(campaigns, campaign => campaign.campaign.id === campaignId);
  }
  render() {
    const campaign = this.campaign();
    if (!campaign) {
      return (
        <h1>Unknown Campaign</h1>
      );
    }
    const {
      scenarios,
    } = campaign;
    const scenarioMap: {
      [id: string]: Scenario;
    } = {};
    forEach(scenarios, scenario => {
      scenarioMap[scenario.id] = scenario;
    });
    return (
      <div>
        <h4>{campaign.campaign.name}</h4>
        <ul>
          { map(campaign.campaign.scenarios, scenarioId => {
            const scenario = scenarioMap[scenarioId];
            if (!scenario) {
              return <li>Could not find {scenarioId}</li>;
            }
            return (
              <li key={scenarioId}>
                <Link to={`/campaign/${campaign.campaign.id}/${scenarioId}`}>
                  {scenario.scenarioName}
                </Link>
              </li>
            );
          }) }
        </ul>
      </div>
    );
  }
}
