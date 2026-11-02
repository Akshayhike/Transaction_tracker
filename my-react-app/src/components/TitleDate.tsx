import {format} from 'date-fns';

type titleProps = {
  title: string;
  date: Date;
}

// Displays the title and date.
function Title_Date(props: titleProps) {
  return (
    <div className="TitleDate" style={{background: 'lightgreen'}}>
      <h2>{props.title}</h2>
      <p>{format(props.date, 'dd MMM yyyy')}</p>
    </div>
  );
}

export default Title_Date;