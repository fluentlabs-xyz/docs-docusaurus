import React from 'react';
import Polipop from 'polipop';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// Default implementation, that you can customize
export default function Root({children}) {

  // if (ExecutionEnvironment.canUseDOM) {
  //   var polipop = new Polipop('mypolipop', {
  //     layout: 'popups',
  //     position: 'bottom-right',
  //     progressbar: true,
  //     sticky: true
  //   });
  //
  //   polipop.add({content: `<b>Reminder:</b> The Shardeum network was restarted on May 30th, 2022 at 10:00 AM UTC due to malicious activity on the network.
  //   <br>
  // <br>
  //   *Network data was not preserved, and contracts will need to be redeployed; accounts that tweeted to receive SHM should retain the same balance`, title: 'Liberty 1.1 Restart', type: 'default'});
  // }

  return <> {
    children
  }</>;

}
