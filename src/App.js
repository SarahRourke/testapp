import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

//initialize for, state as empty strings
const initialFormState = { name: '', description: '' }


function App() {
  const [notes, setNotes] = useState([]);
  //formData is null therefore the state is emptry strings
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  //get all notes
  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }
  //create new note w/ image
  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    //setNotes ...notes - iterates over note objects and adds it to the end of all notes
    setNotes([ ...notes, formData ]);
    //onChange tracks changes to initialFormState and when submitted represents formData
    setFormData(initialFormState);
  }
  //delete ntoes by id
  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  //
  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }


  return (
    <div className="App">
      <h1>My Notes App</h1>
      <div className="forminput">
        <input
          onChange={e => setFormData({ ...formData, 'name': e.target.value})}
          placeholder="Note name"
          value={formData.name}
        />
        <input
          type="textarea"
          onChange={e => setFormData({ ...formData, 'description': e.target.value})}
          placeholder="Note description"
          value={formData.description}
        />
        <input 
          type="file"
          onChange={onChange}
        />
        <button onClick={createNote}>Create Note</button>
      </div>
      <div className="current-notes">
        {
          notes.map(note => (
            <div className="note-info" key={note.id || note.name}>
              <div className="note-text">
                <h2>{note.name}</h2>
                <p>{note.description}</p>
                <button onClick={() => deleteNote(note)}>Delete note</button>
              </div>
              {
                note.image && <img src={note.image} alt="" style={{width: 400}} />
              }
            </div>
          ))
        }
      </div>
        <div className="signout-button">
          <AmplifySignOut />
        </div>
    </div>
  );
}

export default withAuthenticator(App);
