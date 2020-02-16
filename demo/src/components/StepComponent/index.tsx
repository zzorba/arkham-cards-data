import React from 'react';

import EncounterSetsStepComponent from './EncounterSetsStepComponent';
import { Step } from '../../types';

interface Props {
  step: Step
}

export default class StepComponent extends React.Component<Props> {
  render() {
    const { step } = this.props;
    if (step.type === 'encounter_sets') {
      return <EncounterSetsStepComponent step={step} />;
    }
    return (
      <h2>{step.text}</h2>
    );
  }

}
