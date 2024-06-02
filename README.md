# TODO
SolSplit front end

Please read the README.md in the anchor_project directory for an introduction of this application before this one.

The SolSplit frontend is based on the Solana dApp scaffold application, to run the frontend locally just run it with 
yarn run dev 

Since this application is based on the interactions of a group of users, to test all its functionalities you will need a Phantom wallet configured for devnet that contains at least two non empty Solana accounts, three is advised.

The front end contains two main pages, "New Group" that allows the creation of a group and "Group Search" that allows to search, join, add expenses and perform the settling operations.

- First connect the Phantom wallet and create a group in the "New Group" page with a name of your choice
- Then go to the "Group Search" page and search for the group you just created, if no pubkey is supplied in the Admin Pubkey input box then the current logged wallet is used, so the admin can search by only typing the group name. The admin is already a member of the group since the creation.
- At this point you can add expenses with the current user or select another account in the wallet to interact with the group as a different user. When you select a new user please reload the page with F5. 
- If you selected a different account the user must join the group before being able to add expenses
- when a certain amount of expenses has been added you can request the settling from a member's account and complete the procedure from the other members.
- After you are done testing the Group functionalities you can close the Group by selecting the group administrator account in Phantom and delete the Group account

Technical info:
anchor version: 0.29.0
Node: 18.16.0