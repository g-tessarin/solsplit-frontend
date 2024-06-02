
import { FC } from "react";

import { SearchGroup } from "../../components/SearchGroup";

export const SearchGroupView: FC = ({ }) => {

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 ">
          SolSplit
        </h1>
        <h6 className="text-center font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500  mb-8">
          Search for a group
        </h6>
        {/* CONTENT GOES HERE */}
        <div className="text-center">
          <SearchGroup />
          
        </div>
      </div>
    </div>
  );
};
