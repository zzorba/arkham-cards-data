import React from 'react';
import { forEach, map } from 'lodash';
import { Link } from 'react-router-dom'

import { FullCampaign, Scenario } from '../types';
import ScenarioListItem from './ScenarioListItem';

interface Props {
  campaign: FullCampaign
}

export default class Campaign extends React.Component<Props> {
  render() {
    const {
      campaign: {
        campaign,
        scenarios,
      },
    } = this.props;
    const scenarioMap: {
      [id: string]: Scenario;
    } = {};
    forEach(scenarios, scenario => {
      scenarioMap[scenario.id] = scenario;
    });
    return (
      <div>
        <Link to={`/campaign/${campaign.id}`}>
          <h4>{campaign.name}</h4>
        </Link>
        <ul>
          { map(campaign.scenarios, scenarioId => {
            const scenario = scenarioMap[scenarioId];
            if (!scenario) {
              return <li>Could not find {scenarioId}</li>;
            }
            return (
              <ScenarioListItem
                key={scenarioId}
                campaignId={campaign.id}
                scenario={scenario}
              />
            );
          }) }
        </ul>
      </div>
    );
  }
}
