import React from 'react';
import { forEach, map } from 'lodash';

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
        <h4>{campaign.name}</h4>
        <ul>
          { map(campaign.scenarios, scenarioId => {
            const scenario = scenarioMap[scenarioId];
            if (!scenario) {
              return <li>Could not find {scenarioId}</li>;
            }
            return (
              <ScenarioListItem
                key={scenarioId}
                scenario={scenario}
              />
            );
          }) }
        </ul>
      </div>
    );
  }
}
