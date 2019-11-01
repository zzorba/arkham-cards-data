import React from 'react';
import { Scenario } from '../types';

interface Props {
  scenario: Scenario
}

export default class ScenarioListItem extends React.Component<Props> {
  render() {
    const {
      scenario: {
        scenarioName,
        interlude,
      },
    } = this.props;
    if (interlude) {
      return (
        <li><i>{scenarioName}</i></li>
      );
    }
    return (
      <li>{scenarioName}</li>
    );
  }
}
