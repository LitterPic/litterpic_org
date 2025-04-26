import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { db, useAuth } from '../lib/firebase';
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DeleteAccountContent = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [confirmationChecked, setConfirmationChecked] = useState(false);

    const handleDeleteAccount = async () => {
        if (user && confirmationChecked) {
            try {
                // Delete user's comments
                const userCommentsRef = collection(db, 'storyComments');
                const commentUserRef = doc(db, `users/${user.uid}`);
                const commentQuery = query(userCommentsRef, where('commentUser', '==', commentUserRef));

                const commentQuerySnapshot = await getDocs(commentQuery);
                const deleteCommentPromises = commentQuerySnapshot.docs.map((commentDoc) => {
                    return deleteDoc(doc(db, `storyComments/${commentDoc.id}`));
                });
                await Promise.all(deleteCommentPromises);

                // Delete user's posts (similarly)
                const userPostsRef = collection(db, 'userPosts');
                const postUserRef = doc(db, `users/${user.uid}`);
                const postQuery = query(userPostsRef, where('postUser', '==', postUserRef));
                const postQuerySnapshot = await getDocs(postQuery);
                const deletePostPromises = postQuerySnapshot.docs.map((postDoc) => {
                    return deleteDoc(doc(db, `userPosts/${postDoc.id}`));
                });
                await Promise.all(deletePostPromises);

                // Delete user document
                const userRef = doc(db, `users/${user.uid}`);
                await deleteDoc(userRef);

                // Delete user authentication
                await user.delete();

                // Redirect to a suitable page after deletion
                toast.success("Your account and data have been deleted.")

                setTimeout(() => {
                    router.push('/stories');
                }, 5000);
            } catch (error) {
                if (error.code === 'auth/requires-recent-login') {
                    toast.error('Please re-login to confirm your identity.');
                    setTimeout(() => {
                        router.push('/login');
                    }, 5000);
                } else {
                    toast.error('An error occurred while deleting your account.');
                }
            }
        }
    };

    return (
        <div className="page">
            <div className="content">
                <h1 className="heading-text">Delete Account</h1>
                <br />
                <p className="delete-paragraph">
                    We're sorry you've decided to leave LitterPic. We understand that this is an important decision
                    for you, and we want to assure you that your choice is respected. We're here to support you throughout
                    this process. If you choose to delete your account, please know that we will also remove any posts
                    you've made and comments you've left on other users' posts, we value your data privacy. This way, you
                    can have a fresh start if you decide to return in the future. Your contributions were valuable, and we
                    want to express our gratitude for being a part of our community. Should you ever change your mind or
                    need assistance, we'll be here to welcome you back or help in any way we can.
                </p>
                <p className="delete-final-warning"><b>Once you delete your account, we will not be able to recover
                    any deleted data</b></p>
                <div className="delete-confirm">
                    <label className="delete-confirm-label">
                        <input
                            className="delete-confirm-checkbox"
                            type="checkbox"
                            checked={confirmationChecked}
                            onChange={() => setConfirmationChecked(!confirmationChecked)}
                        />
                        <span className="custom-checkbox"></span>
                        <span className="delete-confirm-text">I understand the consequences of deleting my account.</span>
                    </label>
                </div>
                <p className="delete-are-you-sure">Are you sure you want to delete your account?</p>
                <button className="delete-button" onClick={handleDeleteAccount} disabled={!confirmationChecked}>
                    Delete Account
                </button>
                <ToastContainer />
            </div>
        </div>
    );
};

export default DeleteAccountContent;
