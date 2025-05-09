import React, { useState } from 'react';
import styles from './Default.module.css';
import turkey from '../../assets/images/turkey.png'
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';
import { useGameWebSocket } from '../../components/websocket/WebSocketProvider';
import GameTestPanel from '../../components/test/GameTestPanel';

export default function Default() {
  const { isConnected } = useGameWebSocket();
  const [showTestPanel, setShowTestPanel] = useState(false);


  return (
    <div className={styles.layout}>
      <SpinTurkey image={turkey} />
    </div>
  )
}
