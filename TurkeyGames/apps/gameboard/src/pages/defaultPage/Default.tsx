import React from 'react';
import styles from './Default.module.css';
import turkey from '../../assets/images/turkey.png'
import SpinTurkey from '../../components/common/spinTurkey/SpinTurkey';

export default function Default() {
  return (
    <div className={styles.layout}>
      <SpinTurkey image={turkey} />
    </div>
  )
}
