import React, {useState} from 'react';
import withAuth from '../components/withAuth';

function Createpost() {
    const [postTitle, setPostTitle] = useState("");
    const [postDescription, setPostDescription] = useState("");
    const [postImages, setPostImages] = useState([]);
    const [litterWeight, setLitterWeight] = useState(null);
    const [previews, setPreviews] = useState([]);

    const onFileChange = (e) => {
        // Limit the user to upload only up to 5 images
        if (e.target.files.length > 5) {
            console.log('You can only upload up to 5 images');
            return;
        }
        setPostImages(e.target.files);

        // Generate previews
        let newPreviews = Array.from(e.target.files).map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
    };

    const onTitleChange = (e) => {
        setPostTitle(e.target.value);
    };

    const onDescriptionChange = (e) => {
        setPostDescription(e.target.value);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        // Here you can handle the form submission, uploading the images to Firebase, etc.
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/create-post-banner.jpeg" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Create Post</h1>
                    <div className="create-post-content">
                        <form onSubmit={onSubmit}>
                            <div><input type="text" value={postTitle} onChange={onTitleChange}
                                        placeholder="Post Title"/>
                            </div>

                            <div>
                                {previews.map((preview, index) => (
                                    <img key={index} src={preview} alt="Preview"
                                         style={{width: '300px', height: '300px', objectFit: "cover"}}/>
                                ))}
                            </div>
                            <div><input type="file" multiple onChange={onFileChange}/></div>
                            <div><textarea value={postDescription} onChange={onDescriptionChange}
                                           placeholder="Post Description"/></div>
                            <div><input type="number" placeholder="Enter the amount of litter collected"
                                        onChange={(e) => setLitterWeight(e.target.value)}/></div>
                            <div>
                                <button type="submit">Create Post</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(Createpost);
