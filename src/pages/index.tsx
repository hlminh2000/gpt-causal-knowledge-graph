import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import Textarea from '@mui/joy/Textarea';
import { Button, Container, Grid, Input } from '@mui/joy';
import { useState } from 'react';

type KnowledgeGraph = {
  nodes: {
    id: string,
    text: string,
    embeddings: any,
  }[],
  edges: {
    cause: KnowledgeGraph["nodes"][0]["id"]
    effect: KnowledgeGraph["nodes"][0]["id"]
  }[]
}

export default function Home() {

  const [storyText, setStoryText] = useState<string>()
  const [openAiApiKey, setOpenAiApiKey] = useState<string>()
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph>({
    nodes: [],
    edges: []
  })

  const onSubmit = () => {
    // todo
  }

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Container className={styles.center}>
          <Grid container xs={12} spacing={2}>
            <Grid xs={12}>
              <Input
                placeholder='OpenAI API Key' 
                type="password" 
                value={openAiApiKey} 
                onChange={e => setOpenAiApiKey(e.target.value)} 
              />
            </Grid>
            <Grid xs={12}>
              <Textarea 
                placeholder="Type a story..."
                value={storyText}
                onChange={e => setStoryText(e.target.value)}
                size='lg'
                sx={{width: "100%"}}
              />
            </Grid>
            <Grid>
              <Button onClick={onSubmit} disabled={!storyText || !openAiApiKey}> Create </Button>
            </Grid>
          </Grid>
        </Container>
      </main>
    </>
  )
}
