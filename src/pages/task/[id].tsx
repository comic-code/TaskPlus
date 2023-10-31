import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { doc, collection, query, where, getDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore'
import { Textarea } from '@/components/textarea';
import { ChangeEvent, FormEvent, useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import styles from './styles.module.css';
import { db } from '../../services/firebaseConnection';

interface TaskProps {
  task: {
    id: string;
    task: string;
    isPublic: boolean;
    createdAt: string;
    user: string;
  };
  allComments: CommentProps[]
}

interface CommentProps {
  id: string;
  comment: string;
  user: string;
  name: string;
  taskId: string
}

export default function Task({task, allComments}: TaskProps ) {
  const { data: session } = useSession();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<CommentProps[]>(allComments || []);

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if(!comment) return;

    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        comment,
        createdAt: new Date(),
        user: session?.user?.email,
        name: session?.user?.name,
        taskId: task.id     
      });

      const data = {
        id: docRef.id,
        comment,
        user: session?.user?.email || '',
        name: session?.user?.name || '',
        taskId: task?.id     
      }
      setComments((old) => [...old, data]);
      setComment('');
    } catch(err) {
      console.log(err);
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      const docRef = doc(db, 'comments', id);
      await deleteDoc(docRef);
      setComments(old => old.filter(comment => comment.id !== id));
    } catch(err) {
      console.log(err);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Task - Detalhes</title>
      </Head>

      <main className={styles.main}>
        <h1>Task</h1>
        <article className={styles.task}>
          <p>{task.task}</p>
        </article>
      </main>

      {session &&
        <section className={styles.commentsContainer}>
          <h2>Deixar comentário</h2>
          <form onSubmit={handleComment}>
            <Textarea placeholder='Digite seu comentário...' value={comment} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}/>
            <button className={styles.button}>Enviar comentário</button>
          </form>
        </section>
      }
      
      {comments.length > 0 &&
        <section className={styles.commentsContainer}>
          <h2>Comentários</h2>
          {comments.map(comment => 
            <article className={styles.comment} key={comment.id}>
              <div className={styles.headComment}>
                <label className={styles.commentLabel}>{comment.name}</label>
                {comment.user === session?.user?.email &&
                  <button className={styles.buttonTrash} onClick={() => handleDeleteComment(comment.id)}>
                    <FaTrash size={18} color="#ea3140" />
                  </button>
                }
              </div>
              <p>{comment.comment}</p>
            </article>       
          )}
        </section>
      }
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async({ req, params }) =>  {
  const id = params?.id as string;
  const docRef = doc(db, 'tasks', id);
  const snapshot = await getDoc(docRef);

  const q = query(collection(db, 'comments'), where('taskId', '==', id));
  const snapshotComments = await getDocs(q);

  let comments: CommentProps[] = [];
  snapshotComments.forEach(doc => {
    comments.push({
      id: doc.id,
      comment: doc.data().comment,
      user: doc.data().user,
      name: doc.data().name,
      taskId: doc.data().taskId
    })
  })

  if(!snapshot.data() || !snapshot.data()?.isPublic) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  const milliseconds = snapshot.data()?.createdAt.seconds * 1000;
  const task = {
    id,
    task: snapshot.data()?.task,
    isPublic: snapshot.data()?.isPublic,
    createdAt: new Date(milliseconds).toLocaleDateString(),
    user: snapshot.data()?.user,
  }

  return {
    props: {
      task,
      allComments: comments
    }
  }
}
