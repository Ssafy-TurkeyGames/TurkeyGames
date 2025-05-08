import React from 'react';
import styles from './SpinTurkey.module.css';

interface propsType {
    image: string
}

export default function SpinTurkey(props: propsType) {
  return (
    <div className={styles.turkey}>
        <img src={props.image} alt="spinTurkey" />
    </div>
  )
}