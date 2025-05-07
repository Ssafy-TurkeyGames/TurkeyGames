import React from 'react';
import styles from './Default.module.css';
import turkey from '../../assets/images/turkey.png'

export default function Default() {
  return (
    <div className={styles.layout}>
      <div className={styles.turkey}>
        <img src={turkey} />
      </div>
    </div>
  )
}
