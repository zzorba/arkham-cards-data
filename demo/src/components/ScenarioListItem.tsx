import React from 'react';
import { Link } from 'react-router-dom'

import { Scenario } from '../types';

interface Props {
  scenario: Scenario;
  campaignId: string;
}

export default class ScenarioListItem extends React.Component<Props> {
  render() {
    const {
      campaignId,
      scenario: {
        id,
        scenarioName,
        interlude,
      },
    } = this.props;
    if (interlude) {
      return (
        <li>
          <Link to={`/campaign/${campaignId}/${id}`}>
            <i>{scenarioName}</i>
          </Link>
        </li>
      );
    }
    return (
      <Link to={`/campaign/${campaignId}/${id}`}>
        <li>{scenarioName}</li>
      </Link>
    );
  }
}
