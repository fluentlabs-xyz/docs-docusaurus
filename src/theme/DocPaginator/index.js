import React from 'react';
import Link from "@docusaurus/Link";

export default function DocPaginatorWrapper({previous, next}) {
  return (
    <nav 
      style={{
        display: 'flex',
        width: "100%",
        gap: 10,
        marginTop: 20,
      }}
      className='pagination'
    >
      {previous && (
        <Link to={previous.permalink} style={{flex: 1}}>
          <div className='pagination-left'>
          <div className="chevron-arrow-left"></div>
            <div>
              <span>Go back</span>
              <p>{previous.title}</p>
            </div>
          </div>
        </Link>
      )}
      {next && (
        <Link to={next.permalink} style={{flex: 1}}>
         <div className='pagination-right'>
            <div>
              <span>Skip ahead</span>
              <p>{next.title}</p>
            </div>
            <div className="chevron-arrow-right"></div>
          </div>
        </Link>
      )}
    </nav>
  );
}
