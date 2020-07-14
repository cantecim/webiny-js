import { createHandler } from "@webiny/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import { dataManagerPlugins } from "../mocks/dataManagerClient";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import headlessCmsPlugins from "@webiny/api-headless-cms/plugins";
import { JWT_TOKEN_SIGN_SECRET, createJwtToken } from "@webiny/api-security/testing";
import securityAuthenticationPlugins from "@webiny/api-security/plugins/authentication";
import securityAuthJwtPlugins from "@webiny/api-security/plugins/auth/jwt";

const createDataManagerHandler = plugins => createHandler(plugins, dataManager());
import dataManager from "../../src/dataManager/handler";

export default ({ database } = {}) => {
    if (!database) {
        database = new Database();
    }

    const createCmsHandler = () =>
        createHandler(
            neDb({ database }),
            apolloServerPlugins(),
            headlessCmsPlugins(),
            securityAuthenticationPlugins(),
            securityAuthJwtPlugins({
                secret: JWT_TOKEN_SIGN_SECRET
            }),
            settingsManagerPlugins({ functionName: process.env.SETTINGS_MANAGER_FUNCTION }),
            dataManagerPlugins()
        );

    const cmsHandler = createCmsHandler();

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await cmsHandler({
            httpMethod,
            // Set "full-access" JWT token into the "Authorization" header.
            headers: { Authorization: createJwtToken(), ...headers },
            body: JSON.stringify(body),
            ...rest
        });

        return [JSON.parse(response.body), response];
    };

    return {
        database,
        cmsHandler,
        invoke
    };
};