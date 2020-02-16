import React from 'react';
import { find, forEach, map } from 'lodash';

import StepComponent from './StepComponent';
import { AllCampaigns, FullCampaign, Scenario, Step } from '../types';
const campaigns: AllCampaigns = require('../assets/allCampaigns.json');

interface Props {
  campaignId: string;
  scenarioId: string;
}

export default class CampaignScenarioDetail extends React.Component<Props> {
  campaign(): FullCampaign | undefined {
    const { campaignId } = this.props;
    return find(campaigns, campaign => campaign.campaign.id === campaignId);
  }

  scenario(): Scenario | undefined {
    const campaign = this.campaign();
    if (!campaign) {
      return undefined;
    }
    const { scenarioId } = this.props;
    return find(campaign.scenarios, scenario => scenario.id === scenarioId);
  }

  render() {
    const scenario = this.scenario();
    if (!scenario) {
      return (
        <h1>Unknown Scenario</h1>
      );
    }
    const steps: {
      [id: string]: Step;
    } = {};
    forEach(scenario.steps, step => {
      steps[step.id] = step;
    })

    return (
      <div>
        <h4>
          {scenario.scenarioName}
        </h4>
        { map(scenario.setup, stepId => {
            const step = steps[stepId];
            if (!step) {
              return null;
            }
            return (
              <StepComponent key={stepId} step={step} />
            );
          }) }
      </div>
    );
  }
}
