// Copyright 2017-2018 @polkadot/app-example authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { ApiProps } from '@polkadot/ui-react-rx/types';

import React from 'react';

import storage from '@polkadot/storage';
import createStorageKey from '@polkadot/storage/key';
import withApi from '@polkadot/ui-react-rx/with/api';
import storageTransform from '@polkadot/ui-react-rx/with/transform/storage';
import encodeAddress from '@polkadot/util-keyring/address/encode';

const intentionsMethod = storage.staking.public.intentions;
const proposalMethod = storage.democracy.public.proposals;

type State = {
  intentions: string[],
  proposals: {
    [index: string]: number[]
  },
  subscriptions: any[]
};

class Comp extends React.PureComponent<ApiProps, State> {
  constructor (props: ApiProps) {
    super(props);

    this.state = {
      intentions: [],
      proposals: {},
      subscriptions: []
    };
  }

  componentDidMount () {
    this.setState({
      subscriptions: [
        this.subscribeIntentions(),
        this.subscribeProposals()
      ]
    });
  }

  subscribeIntentions () {
    const { api } = this.props;
    const key = createStorageKey(intentionsMethod)();
    const transform = storageTransform(intentionsMethod);

    return api.state
      .getStorage(key)
      .subscribe((value) => {
        this.setState({
          intentions: (transform(value, 0) as any[]).map(encodeAddress)
        });
      });
  }

  subscribeProposals () {
    const { api } = this.props;
    const key = createStorageKey(proposalMethod)();
    const transform = storageTransform(proposalMethod);

    return api.state
      .getStorage(key)
      .subscribe((value) => {
        this.setState({
          proposals: (transform(value, 0) as any[])
          .reduce((proposals, [propIdx, proposal, accountId]) => {
            const address = encodeAddress(accountId);

            if (!proposals[address]) {
              proposals[address] = [propIdx];
            } else {
              proposals[address].push(propIdx);
            }

            return proposals;
          }, {})
        });
      });
  }

  componentWillUnmount () {
    const { subscriptions } = this.state;

    subscriptions.forEach((sub) => sub.unsubscribe());
  }

  render () {
    const { intentions, proposals } = this.state;

    return (
      <div>Found {Object.keys(proposals).length} accounts making proposals and {intentions.length} accounts intending to stake.</div>
    );
  }
}

export default withApi(Comp);
