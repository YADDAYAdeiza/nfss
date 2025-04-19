'use client'

import { useEffect } from 'react';
import { Client, Account } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // or your endpoint
  .setProject('your-project-id');

const account = new Account(client);

export default function Trial() {
  useEffect(() => {
    alert('Authing...')
    account.get()
      .then(user => {
        console.log('User is authenticated:', user);
      })
      .catch(err => {
        console.error('User not logged in:', err);
      });
      console.log('Authing...')
  }, []);

  return <div>Checking auth...</div>;
}
