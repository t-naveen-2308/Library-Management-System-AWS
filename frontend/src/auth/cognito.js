import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';

// These values would normally be injected by Vite env vars via CDK outputs
const poolData = {
    UserPoolId: import.meta.env.VITE_USER_POOL_ID || 'dummy-pool-id', // e.g. us-east-1_XXXXX
    ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || 'dummy-client-id' // e.g. XXXXXX
};

const userPool = new CognitoUserPool(poolData);

export const authenticate = (username, password) => {
    return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
        });

        const cognitoUser = new CognitoUser({
            Username: username,
            Pool: userPool,
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => resolve(result),
            onFailure: (err) => reject(err),
        });
    });
};

export const logout = () => {
    const user = userPool.getCurrentUser();
    if (user) {
        user.signOut();
    }
};

export const getCurrentSession = () => {
    return new Promise((resolve, reject) => {
        const user = userPool.getCurrentUser();
        if (user) {
            user.getSession((err, session) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(session);
                }
            });
        } else {
            reject(new Error('No current user'));
        }
    });
};
