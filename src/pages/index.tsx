import Head from 'next/head';
import Image from 'next/image';
import { GetStaticProps } from 'next';

import styles from '../styles/home.module.css';
import heroImg from '../../public/assets/hero.png';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebaseConnection';

interface HomeProps {
  tasks: number,
  comments: number
}

export default function Home({ comments, tasks }: HomeProps) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Task+ | Organize suas tarefas de forma fácil.</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.logoContent}>
          <Image className={styles.hero} alt="Task+" src={heroImg} priority />
        </div>
        <h1 className={styles.title}>
          Sistema feito para você organizar <br/>seus estudos e tarefas.
        </h1>

        <div className={styles.infoContent}>
          <section className={styles.box}>
            <span>+{tasks} tasks</span>
          </section>
          <section className={styles.box}>
            <span>+{comments} comentários</span>
          </section>
        </div>
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async({  }) =>  {
  const commentsRef = collection(db, 'comments');
  const commentSnapshot = await getDocs(commentsRef)
  const tasksRef = collection(db, 'tasks');
  const tasksSnapshot = await getDocs(tasksRef)

  return {
    props: {
      tasks: tasksSnapshot.size || 0,
      comments: commentSnapshot.size || 0
    },
    revalidate: 600
  }
}