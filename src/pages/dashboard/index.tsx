import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

import styles from './styles.module.css'
import { Textarea } from '@/components/textarea';
import { FiShare2 } from 'react-icons/fi';
import { FaTrash } from 'react-icons/fa';

import { db } from '@/services/firebaseConnection';
import { addDoc, collection, query, orderBy, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

interface DashboardProps {
  user: {
    email: String
  }
}

interface TaskProps {
  id: string;
  createdAt: Date;
  isPublic: boolean;
  user: string;
  task: string;
}

export default function Dashboard({ user }: DashboardProps) {
  const [input, setInput] = useState('');
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();
    if(input === '') return;

    try {
      await addDoc(collection(db, 'tasks'), {
        createdAt: new Date(),
        user: user.email,
        task: input,
        isPublic: publicTask,
      })

      setInput('');
      setPublicTask(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function getTasks() {
    const tasksRef = collection(db, "tasks");
    const q = query(
      tasksRef,
      orderBy("createdAt", "desc"),
      where("user", "==", user?.email)
    )

    onSnapshot(q, (snapshot) => {
      let list = [] as TaskProps[];
      snapshot.forEach(doc => {
        list.push({
          id: doc.id,
          task: doc.data().task,
          createdAt: doc.data().createdAt,
          user: doc.data().user,
          isPublic: doc.data().isPublic
        });
      });
      setTasks(list);
    })
  }

  async function handleShareTask(id: string) {
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`
    );

    alert("Link da task copiado com sucesso!");
  }

  async function handleDeleteTask(id: string) {
    const docRef = doc(db,"tasks", id);
    await deleteDoc(docRef);
  }

  useEffect(() => {
    getTasks();
  }, [user?.email]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Painel de tasks</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
            <h1 className={styles.title}>Qual sua task?</h1>
            <form onSubmit={handleRegisterTask}>
              <Textarea 
                placeholder='Descreva sua tarefa...'
                value={input}
                onChange={(e:ChangeEvent<HTMLTextAreaElement>) => 
                  setInput(e.target.value)
                }
              />
              <div className={styles.checkboxArea}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox}
                  checked={publicTask}
                  onChange={() => setPublicTask(old => !old)}  
                />
                <label>Deixar tarefa pública?</label>
              </div>
              <button type="submit" className={styles.button}>
                Registrar
              </button>
            </form>
          </div>
        </section>
        <section className={styles.taskContainer}>
          <h1>Minhas Tasks</h1>
          {tasks.map(task => 
            <article className={styles.task} key={task.id}>
              {task.isPublic &&
                <div className={styles.tagContainer}>
                  <label className={styles.tag}>PÚBLICA</label>
                  <button className={styles.shareButton} onClick={() => handleShareTask(task.id)}>
                    <FiShare2 size={22} color="#3183ff" />
                  </button>
                </div>
              }
              <div className={styles.taskContent}>
                {task.isPublic 
                  ? <Link href={`/task/${task.id}`}>
                      <p>{task.task}</p>
                    </Link>
                  : <p>{task.task}</p>
                }
                <button className={styles.trashButton} onClick={() => handleDeleteTask(task.id)}>
                  <FaTrash size={24} color="#ea3140" />
                </button>
              </div>
            </article>
          )}
        </section>
      </main>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async({ req }) =>  { 
  const session = await getSession({ req });
  if(!session?.user) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }
  return {
    props: {
      user: {
        email: session?.user?.email
      }
    }
  }
}