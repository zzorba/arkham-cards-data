import React from 'react';
import { map } from 'lodash';

import { EncounterSetsStep } from '../../types';

interface Props {
  step: EncounterSetsStep
}

export default class EncounterSetsStepComponent extends React.Component<Props> {
  render() {
    const { step } = this.props;
    return (
      <>
        <p>Gather the following encounter sets:</p>
        <ul>
          {map(step.encounter_sets, encounter_set => <li key={encounter_set}>{encounter_set}</li>)}
        </ul>
        { !!step.text && <p>{step.text}</p> }
      </>
    );
  }

}
