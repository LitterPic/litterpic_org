import React, {useEffect, useState} from 'react';
import {storage, db} from '../lib/firebase';

function UploadForm() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    const types = ['image/png', 'image/jpeg', 'image/gif'];

    const handleChange = (e) => {
        let selected = e.target.files[0];

        if (selected && types.includes(selected.type)) {
            setFile(selected);
            setError('');
        } else {
            setFile(null);
            setError('Please select an image file (png or jpg)');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (file) {
            const storageRef = storage.ref(`posts/${file.name}`);
            const task = storageRef.put(file);

            task.on(
                'state_changed',
                (snapshot) => {
                    // Progress function ...
                },
                (err) => {
                    setError(err.message);
                },
                () => {
                    // Complete function ...
                    task.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        console.log('File available at', downloadURL);

                        // Save the post details to Firestore
                        db.collection('posts')
                            .add({
                                imageUrl: downloadURL,
                                createdAt: new Date(),
                            })
                            .then(() => {
                                console.log('Post saved successfully!');
                            })
                            .catch((error) => {
                                setError(error.message);
                            });
                    });
                }
            );
        } else {
            setError('Please select an image file (png or jpg)');
        }
    };

    return (
        <form onSubmit={handleUpload}>
            <input type="file" onChange={handleChange}/>
            <button type="submit">Upload</button>
            <div className="output">
                {error && <div className="error">{error}</div>}
                {file && <div>{file.name}</div>}
            </div>
        </form>
    );
}

export default UploadForm;
