interface LeadershipModelProps {
  className?: string;
}

export function LeadershipModel({ className }: LeadershipModelProps) {
  return (
    <img
      src="/brand/tlc-model.png"
      alt="The EQ · IQ · MQ™ Leadership Operating System — three overlapping circles representing Build the Leader (EQ), Build the Team (IQ), and Build Future Leaders (MQ™), with nine outer behaviors."
      className={className}
    />
  );
}
