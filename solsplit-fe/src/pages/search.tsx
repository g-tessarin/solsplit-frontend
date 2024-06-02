import type { NextPage } from "next";
import Head from "next/head";
import { SearchGroupView } from "../views";

const SearchGroup: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Search Group</title>
        <meta
          name="SearchGroup"
          content="Search Group"
        />
      </Head>
      <SearchGroupView />
    </div>
  );
};

export default SearchGroup;
