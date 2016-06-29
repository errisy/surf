# surf
An algorithm that implements solvent accessibility test.

This algorithm tests whether a amino acid residue is exposed to water.

By using proper radii for water molecule and functional groups, it no longer relies on the integration of surface area. It decomposes the tests into sets of three-variable linear equations. The solutions of those equations were tested by convex condition. If convex vertex exists, a functional group passes the test.
