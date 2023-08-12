import React, {useState} from 'react';
import {storage, db} from '../lib/firebase';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UploadForm() {
    const [file, setFile] = useState(null);

    const types = ['image/png', 'image/jpeg', 'image/gif'];

    const handleChange = (e) => {
        let selected = e.target.files[0];

        if (selected && types.includes(selected.type)) {
            setFile(selected);
        } else {
            setFile(null);
            toast.error('Please select an image file (png or jpg)');
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
                    toast.error(err.message);
                },
                () => {
                    // Complete function ...
                    task.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        // Save the post details to Firestore
                        db.collection('posts')
                            .add({
                                imageUrl: downloadURL,
                                createdAt: new Date(),
                            })
                            .then(() => {

                            })
                            .catch((error) => {
                                toast.error(error.message);
                            });
                    });
                }
            );
        } else {
            toast.error('Please select an image file (png or jpg)');
        }
    };

    return (
        <form onSubmit={handleUpload}>
            <ToastContainer/>
            <input type="file" onChange={handleChange}/>
            <button type="submit">Upload</button>
            <div className="output">
                {file && <div>{file.name}</div>}
            </div>
        </form>
    );
}

export default UploadForm;
