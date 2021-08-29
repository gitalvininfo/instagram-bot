import { IgApiClient, MediaRepositoryLikersResponseUsersItem } from 'instagram-private-api';
import { config } from 'dotenv';

export default class BotService {

    ig: IgApiClient;
    user: string;
    password: string;
    accountToParse: string = "fireship_dev";
    usersToFollow: MediaRepositoryLikersResponseUsersItem[];

    constructor() {
        config();
        this.user = process.env.USER;
        this.password = process.env.PASS;
        this.ig = new IgApiClient();
    }

    async run() {
        await this.login();

        setInterval(async () => {
            if (!this.usersToFollow || this.usersToFollow.length < 1) {
                console.log('getting latest post likers.')
                await this.getLatestPostLikers();
            } else {
                console.log(`We have ${this.usersToFollow.length} users we can follow`)
                const user = this.usersToFollow.pop();
                console.log(`attempting to following user ${user.username}`)
                await this.follow(user.pk)
            }
        }, 60000)
    }

    async follow(userId: number) {
        console.log('folllowed')
        await this.ig.friendship.create(userId);
    }

    async getLatestPostLikers() {
        const id = await this.ig.user.getIdByUsername(this.accountToParse);
        const feed = await this.ig.feed.user(id);
        const posts = await feed.items();
        this.usersToFollow = await (await this.ig.media.likers(posts[0].id)).users;
    }

    async login() {
        this.ig.state.generateDevice(this.user);

        // acts as real user prelogin
        await this.ig.simulate.preLoginFlow();
        const loggedInAccount = await this.ig.account.login(this.user, this.password);
        await this.ig.simulate.postLoginFlow();
        console.log(loggedInAccount.full_name);
    }
}